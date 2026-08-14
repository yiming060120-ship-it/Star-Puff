import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRANTS_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(GRANTS_DIR, "starpuff.sqlite3");

let db: any = null;

function ensureDir() {
  if (!fs.existsSync(GRANTS_DIR)) fs.mkdirSync(GRANTS_DIR, { recursive: true });
}

function init() {
  if (db) return;
  ensureDir();
  // load better-sqlite3 via createRequire for ESM compatibility
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3");
  db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS grants (
      orderId TEXT PRIMARY KEY,
      steamId TEXT,
      itemId INTEGER,
      payload TEXT,
      grantedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      steamId TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      membershipExpires TEXT
    );
  `);
}

init();

export function insertGrant(grant: any) {
  const stmt = db.prepare(`INSERT INTO grants (orderId, steamId, itemId, payload, grantedAt) VALUES (?, ?, ?, ?, ?)`);
  stmt.run(grant.orderId, grant.steamId, grant.itemId, JSON.stringify(grant.payload), grant.grantedAt);
}

export function deleteGrant(orderId: string) {
  const stmt = db.prepare(`DELETE FROM grants WHERE orderId = ?`);
  stmt.run(orderId);
}

export function getGrant(orderId: string) {
  const stmt = db.prepare(`SELECT * FROM grants WHERE orderId = ?`);
  const row = stmt.get(orderId);
  if (!row) return null;
  return {
    orderId: row.orderId,
    steamId: row.steamId,
    itemId: row.itemId,
    payload: JSON.parse(row.payload),
    grantedAt: row.grantedAt,
  };
}

export function listGrants() {
  const stmt = db.prepare(`SELECT * FROM grants ORDER BY grantedAt DESC`);
  const rows = stmt.all();
  return rows.map((row: any) => ({
    orderId: row.orderId,
    steamId: row.steamId,
    itemId: row.itemId,
    payload: JSON.parse(row.payload),
    grantedAt: row.grantedAt,
  }));
}

export function getUser(steamId: string) {
  const stmt = db.prepare(`SELECT * FROM users WHERE steamId = ?`);
  const row = stmt.get(steamId);
  if (!row) return null;
  return { steamId: row.steamId, coins: row.coins, membershipExpires: row.membershipExpires };
}

export function upsertUser(steamId: string, coins: number, membershipExpires: string | null) {
  const stmt = db.prepare(`INSERT INTO users (steamId, coins, membershipExpires) VALUES (?, ?, ?) ON CONFLICT(steamId) DO UPDATE SET coins=excluded.coins, membershipExpires=excluded.membershipExpires`);
  stmt.run(steamId, coins, membershipExpires);
}

export function applyGrantTransaction(grant: any) {
  const tx = db.transaction((g: any) => {
    // insert grant
    insertGrant(g);
    // update user
    const user = getUser(g.steamId) || { steamId: g.steamId, coins: 0, membershipExpires: null };
    if (g.payload.kind === "stardust_coins") {
      user.coins = (user.coins || 0) + g.payload.amount;
    } else if (g.payload.kind === "membership") {
      const days = g.payload.membershipLevel === "vip_year" ? 365 * g.payload.amount : 30 * g.payload.amount;
      const now = new Date();
      const currentExpiry = user.membershipExpires ? new Date(user.membershipExpires) : null;
      const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 3600 * 1000);
      user.membershipExpires = newExpiry.toISOString();
    }
    upsertUser(user.steamId, user.coins, user.membershipExpires);
  });
  tx(grant);
}

export function revertGrantTransaction(grant: any) {
  const tx = db.transaction((g: any) => {
    deleteGrant(g.orderId);
    const user = getUser(g.steamId);
    if (!user) return;
    if (g.payload.kind === "stardust_coins") {
      user.coins = Math.max(0, (user.coins || 0) - g.payload.amount);
      upsertUser(user.steamId, user.coins, user.membershipExpires);
    } else if (g.payload.kind === "membership") {
      if (user.membershipExpires) {
        const days = g.payload.membershipLevel === "vip_year" ? 365 * g.payload.amount : 30 * g.payload.amount;
        const expiry = new Date(user.membershipExpires);
        const newExpiry = new Date(expiry.getTime() - days * 24 * 3600 * 1000);
        const next = newExpiry > new Date() ? newExpiry.toISOString() : null;
        upsertUser(user.steamId, user.coins, next);
      }
    }
  });
  tx(grant);
}
