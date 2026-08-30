/**
 * StarryBackground - 动态星空背景（视觉焕新）
 *
 * 在现有深色背景之上叠加一层动态星空：闪烁的星星 + 缓慢漂移的星云团。
 * 纯装饰层（pointer-events-none，z-index 0），不干扰任何现有交互。
 * 用 requestAnimationFrame 驱动，性能开销极低。
 */

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
  twinkleSpeed: number;
  drift: number;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 星星数量随屏幕面积自适应（保持稀疏精致，不密集）
      const count = Math.min(160, Math.floor((canvas.width * canvas.height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.008 + Math.random() * 0.025,
        drift: 0.05 + Math.random() * 0.25,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    // 星云团（相对坐标，随屏幕缩放）
    const nebulas = [
      { x: 0.2, y: 0.28, r: 0.42, color: [139, 111, 184] },   // 雾紫
      { x: 0.8, y: 0.55, r: 0.5, color: [244, 114, 182] },    // 浅粉紫
      { x: 0.5, y: 0.82, r: 0.45, color: [96, 165, 250] },    // 淡蓝
    ];

    const animate = () => {
      // [性能优化] 页面隐藏时跳过绘制
      if (document.hidden) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 透明底色（透出 App 原有径向渐变）
      ctx.clearRect(0, 0, w, h);

      // 绘制星云团（柔和径向渐变）
      for (const nb of nebulas) {
        const cx = nb.x * w;
        const cy = nb.y * h;
        const r = nb.r * Math.max(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        const [cr, cg, cb] = nb.color;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},0.10)`);
        g.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.04)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // 绘制星星（闪烁 + 缓慢上漂）
      const t = performance.now() / 1000;
      for (const s of stars) {
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase));
        s.y -= s.drift * 0.02;
        if (s.y < -5) {
          s.y = h + 5;
          s.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 223, 255, ${twinkle * 0.8})`;
        ctx.fill();

        // 较大的星星加一层柔和光晕
        if (s.size > 1.4) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 165, 232, ${twinkle * 0.12})`;
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
