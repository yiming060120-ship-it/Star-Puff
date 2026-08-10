/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API lightweight Synthesizer for high-fidelity 8-bit species-specific and stardust sound effects
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helpers for procedural noise generation (purr, hiss, chewing rustling)
function createNoiseNode(ctx: AudioContext, type: "white" | "pink" | "brown", duration: number) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "brown") {
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Amplify brown noise
    } else if (type === "pink") {
      data[i] = (lastOut + (0.12 * white)) / 1.12;
      lastOut = data[i];
      data[i] *= 2.5; // Amplify pink noise
    } else {
      data[i] = white;
    }
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  return noiseNode;
}

export type SoundType =
  // Existing
  | "click" | "sparkle" | "beep" | "chime" | "success" | "bubble"
  // Cat
  | "cat_purr" | "cat_petted" | "cat_happy_meows" | "cat_curious_meow" | "cat_hiss" | "cat_double_meow" | "cat_excited" | "cat_sleep_purr" | "cat_protest"
  // Dog
  | "dog_bark_double" | "dog_whimper_soft" | "dog_excited_barks" | "dog_paw_bark" | "dog_super_excited" | "dog_lick_whimper" | "dog_jump_pray" | "dog_sleep_snore" | "dog_protest"
  // Rabbit
  | "rabbit_nose" | "rabbit_purr" | "rabbit_ear_chirp" | "rabbit_wash_face" | "rabbit_excited" | "rabbit_sleep"
  // Hamster
  | "hamster_chirp" | "hamster_content" | "hamster_chewing" | "hamster_sleep"
  // Universal
  | "stardust_shrink" | "stardust_bounce" | "stardust_grow" | "stardust_lick" | "stardust_flash";

export function playSound(type: SoundType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case "click":
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case "sparkle":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case "beep":
        osc.type = "square";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "chime":
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "success":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.setValueAtTime(329.63, now + 0.08);
        osc.frequency.setValueAtTime(392.00, now + 0.16);
        osc.frequency.setValueAtTime(523.25, now + 0.24);
        osc.frequency.setValueAtTime(659.25, now + 0.32);
        osc.frequency.setValueAtTime(783.99, now + 0.40);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.005, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        break;

      case "bubble":
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      // ==================== CAT SOUNDS ====================
      case "cat_purr": {
        // Low frequency motor hum: 250Hz. Lowpass brown noise.
        const noise = createNoiseNode(ctx, "brown", 1.5);
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();

        noiseFilter.type = "lowpass";
        noiseFilter.frequency.setValueAtTime(250, now);

        noiseGain.gain.setValueAtTime(0.05, now);
        noiseGain.gain.linearRampToValueAtTime(0.05, now + 1.2);
        noiseGain.gain.linearRampToValueAtTime(0.001, now + 1.5);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 1.5);

        // Gentle high pitch meow overlay
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.45);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
        osc.start(now + 0.1);
        osc.stop(now + 0.45);
        break;
      }

      case "cat_petted": {
        // Loud happy purring (2.0s duration) + sweet short chirp
        const noise = createNoiseNode(ctx, "brown", 2.0);
        const filter = ctx.createBiquadFilter();
        const nGain = ctx.createGain();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, now);
        nGain.gain.setValueAtTime(0.08, now);
        nGain.gain.linearRampToValueAtTime(0.001, now + 2.0);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 2.0);

        // Chirpy meow
        osc.type = "triangle";
        osc.frequency.setValueAtTime(512, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(530, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case "cat_happy_meows": {
        // Two meows: one high, one low
        osc.type = "triangle";
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(380, now + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(460, now + 0.35);
        osc2.frequency.exponentialRampToValueAtTime(350, now + 0.5);
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.linearRampToValueAtTime(0.06, now + 0.28);
        gain2.gain.linearRampToValueAtTime(0.001, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.3);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.5);
        break;
      }

      case "cat_curious_meow":
        // Light meow (question tone: sweeps upwards at end)
        osc.type = "sine";
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case "cat_hiss": {
        // Unhappy hissing sound (High-pass filtered white noise)
        const whiteNoise = createNoiseNode(ctx, "white", 0.4);
        const filter = ctx.createBiquadFilter();
        const nGain = ctx.createGain();

        filter.type = "highpass";
        filter.frequency.setValueAtTime(4500, now);

        nGain.gain.setValueAtTime(0.12, now);
        nGain.gain.linearRampToValueAtTime(0.001, now + 0.4);

        whiteNoise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        
        whiteNoise.start(now);
        whiteNoise.stop(now + 0.4);

        // Low growl pitch
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(95, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case "cat_double_meow": {
        // Double happy kitten squeaks
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(550, now + 0.28);
        osc2.frequency.exponentialRampToValueAtTime(780, now + 0.40);
        osc2.frequency.exponentialRampToValueAtTime(520, now + 0.58);
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.linearRampToValueAtTime(0.08, now + 0.32);
        gain2.gain.linearRampToValueAtTime(0.001, now + 0.58);

        osc.start(now);
        osc.stop(now + 0.25);
        osc2.start(now + 0.28);
        osc2.stop(now + 0.58);
        break;
      }

      case "cat_excited": {
        // High ascending pitch: meow-meow-meow!
        for (let i = 0; i < 3; i++) {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.connect(subGain);
          subGain.connect(ctx.destination);

          subOsc.type = "triangle";
          const startPitch = 480 + i * 110;
          const peakPitch = 680 + i * 130;
          const endPitch = startPitch - 40;

          const startS = now + i * 0.22;
          subOsc.frequency.setValueAtTime(startPitch, startS);
          subOsc.frequency.exponentialRampToValueAtTime(peakPitch, startS + 0.08);
          subOsc.frequency.exponentialRampToValueAtTime(endPitch, startS + 0.18);

          subGain.gain.setValueAtTime(0.0, now);
          subGain.gain.linearRampToValueAtTime(0.07, startS + 0.03);
          subGain.gain.linearRampToValueAtTime(0.001, startS + 0.18);

          subOsc.start(startS);
          subOsc.stop(startS + 0.18);
        }
        break;
      }

      case "cat_sleep_purr": {
        // Cyclic breathing low motor hum (1.0s loop)
        const noise = createNoiseNode(ctx, "brown", 1.0);
        const filter = ctx.createBiquadFilter();
        const nGain = ctx.createGain();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(140, now);
        nGain.gain.setValueAtTime(0.04, now);
        nGain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        nGain.gain.linearRampToValueAtTime(0.04, now + 1.0);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 1.0);
        break;
      }

      case "cat_protest":
        // Lower pitch meow with rapid vibrato
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(350, now + 0.1);
        osc.frequency.linearRampToValueAtTime(280, now + 0.3);
        
        // Add lowpass filter to make it softer
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(800, now);
        
        osc.disconnect(gain);
        osc.connect(lowpass);
        lowpass.connect(gain);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      // ==================== DOG SOUNDS ====================
      case "dog_bark_double": {
        // High frequency bark - "Woof!"
        for (let i = 0; i < 2; i++) {
          const dOsc = ctx.createOscillator();
          const dGain = ctx.createGain();
          dOsc.connect(dGain);
          dGain.connect(ctx.destination);

          dOsc.type = "triangle";
          const startS = now + i * 0.15;
          dOsc.frequency.setValueAtTime(340, startS);
          dOsc.frequency.exponentialRampToValueAtTime(680, startS + 0.03);
          dOsc.frequency.exponentialRampToValueAtTime(120, startS + 0.08);

          dGain.gain.setValueAtTime(0.0, now);
          dGain.gain.linearRampToValueAtTime(0.12, startS + 0.02);
          dGain.gain.linearRampToValueAtTime(0.001, startS + 0.08);

          dOsc.start(startS);
          dOsc.stop(startS + 0.08);
        }
        break;
      }

      case "dog_whimper_soft":
        // Soft whining "Awooo~"
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.5);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case "dog_excited_barks": {
        // 3 enthusiastic barks
        for (let i = 0; i < 3; i++) {
          const dOsc = ctx.createOscillator();
          const dGain = ctx.createGain();
          dOsc.connect(dGain);
          dGain.connect(ctx.destination);

          dOsc.type = "triangle";
          const startS = now + i * 0.18;
          dOsc.frequency.setValueAtTime(320 + i * 40, startS);
          dOsc.frequency.exponentialRampToValueAtTime(700 + i * 50, startS + 0.04);
          dOsc.frequency.exponentialRampToValueAtTime(150, startS + 0.1);

          dGain.gain.setValueAtTime(0.0, now);
          dGain.gain.linearRampToValueAtTime(0.12, startS + 0.02);
          dGain.gain.linearRampToValueAtTime(0.001, startS + 0.1);

          dOsc.start(startS);
          dOsc.stop(startS + 0.1);
        }
        break;
      }

      case "dog_paw_bark":
        // A single bright high "woof!"
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case "dog_super_excited": {
        // 5+ barking combo!
        for (let i = 0; i < 6; i++) {
          const dOsc = ctx.createOscillator();
          const dGain = ctx.createGain();
          dOsc.connect(dGain);
          dGain.connect(ctx.destination);

          dOsc.type = "triangle";
          const startS = now + i * 0.12;
          dOsc.frequency.setValueAtTime(300 + Math.sin(i) * 60, startS);
          dOsc.frequency.exponentialRampToValueAtTime(650 + Math.cos(i) * 100, startS + 0.03);
          dOsc.frequency.exponentialRampToValueAtTime(130, startS + 0.08);

          dGain.gain.setValueAtTime(0.0, now);
          dGain.gain.linearRampToValueAtTime(0.1, startS + 0.015);
          dGain.gain.linearRampToValueAtTime(0.001, startS + 0.08);

          dOsc.start(startS);
          dOsc.stop(startS + 0.08);
        }
        break;
      }

      case "dog_lick_whimper": {
        // Licking "吧唧" + happy whining whimper
        for (let i = 0; i < 2; i++) {
          const lOsc = ctx.createOscillator();
          const lGain = ctx.createGain();
          lOsc.connect(lGain);
          lGain.connect(ctx.destination);
          
          lOsc.type = "sine";
          const startS = now + i * 0.2;
          lOsc.frequency.setValueAtTime(100, startS);
          lOsc.frequency.exponentialRampToValueAtTime(1400, startS + 0.12);
          
          lGain.gain.setValueAtTime(0.0, now);
          lGain.gain.linearRampToValueAtTime(0.05, startS + 0.04);
          lGain.gain.linearRampToValueAtTime(0.001, startS + 0.12);
          
          lOsc.start(startS);
          lOsc.stop(startS + 0.12);
        }

        // Underlaying Whine
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now + 0.3);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.50);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.85);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.85);
        osc.start(now + 0.3);
        osc.stop(now + 0.85);
        break;
      }

      case "dog_jump_pray": {
        // Low jumps thuds + friendly double bark
        const thudNode = createNoiseNode(ctx, "brown", 0.3);
        const thudFilter = ctx.createBiquadFilter();
        const thudGain = ctx.createGain();
        thudFilter.type = "lowpass";
        thudFilter.frequency.setValueAtTime(80, now);
        thudGain.gain.setValueAtTime(0.15, now);
        thudGain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        thudNode.connect(thudFilter);
        thudFilter.connect(thudGain);
        thudGain.connect(ctx.destination);
        thudNode.start(now);
        thudNode.stop(now + 0.3);

        // Barks
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.19);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.28);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.17);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now + 0.15);
        osc.stop(now + 0.28);
        break;
      }

      case "dog_sleep_snore": {
        // Deep breathing whimper/snore
        const noise = createNoiseNode(ctx, "brown", 1.5);
        const filter = ctx.createBiquadFilter();
        const nGain = ctx.createGain();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(110, now);
        nGain.gain.setValueAtTime(0.03, now);
        nGain.gain.linearRampToValueAtTime(0.03, now + 0.7);
        nGain.gain.linearRampToValueAtTime(0.001, now + 1.5);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 1.5);
        break;
      }

      case "dog_protest":
        // Low dog growl
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(95, now + 0.2);
        osc.frequency.linearRampToValueAtTime(65, now + 0.55);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, now);

        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
        break;

      // ==================== RABBIT SOUNDS ====================
      case "rabbit_nose": {
        // High soft "噗噗" pop bubble pops
        for (let i = 0; i < 3; i++) {
          const rOsc = ctx.createOscillator();
          const rGain = ctx.createGain();
          rOsc.connect(rGain);
          rGain.connect(ctx.destination);
          
          rOsc.type = "sine";
          const startS = now + i * 0.12;
          rOsc.frequency.setValueAtTime(800 + i * 200, startS);
          rOsc.frequency.exponentialRampToValueAtTime(2500, startS + 0.04);
          
          rGain.gain.setValueAtTime(0.0, now);
          rGain.gain.linearRampToValueAtTime(0.03, startS + 0.015);
          rGain.gain.linearRampToValueAtTime(0.001, startS + 0.04);
          
          rOsc.start(startS);
          rOsc.stop(startS + 0.04);
        }
        break;
      }

      case "rabbit_purr": {
        // Soft clicking or grinding clucks "咕咕" (low-freq hums)
        const cluckCount = 4;
        for (let i = 0; i < cluckCount; i++) {
          const cOsc = ctx.createOscillator();
          const cGain = ctx.createGain();
          cOsc.connect(cGain);
          cGain.connect(ctx.destination);

          cOsc.type = "sine";
          const startS = now + i * 0.09;
          cOsc.frequency.setValueAtTime(150, startS);
          cOsc.frequency.exponentialRampToValueAtTime(300, startS + 0.03);
          cOsc.frequency.exponentialRampToValueAtTime(60, startS + 0.06);

          cGain.gain.setValueAtTime(0.0, now);
          cGain.gain.linearRampToValueAtTime(0.04, startS + 0.01);
          cGain.gain.linearRampToValueAtTime(0.001, startS + 0.06);

          cOsc.start(startS);
          cOsc.stop(startS + 0.06);
        }
        break;
      }

      case "rabbit_ear_chirp":
        // Soft high "叽"
        osc.type = "sine";
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case "rabbit_wash_face": {
        // Rustling rub speed
        const washCount = 5;
        for (let i = 0; i < washCount; i++) {
          const noise = createNoiseNode(ctx, "pink", 0.08);
          const filter = ctx.createBiquadFilter();
          const nGain = ctx.createGain();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(1200 + i * 150, now + i * 0.1);
          nGain.gain.setValueAtTime(0.0, now);
          nGain.gain.linearRampToValueAtTime(0.06, now + i * 0.1 + 0.02);
          nGain.gain.linearRampToValueAtTime(0.001, now + i * 0.1 + 0.08);
          
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(ctx.destination);
          
          noise.start(now + i * 0.1);
          noise.stop(now + i * 0.1 + 0.08);
        }
        break;
      }

      case "rabbit_excited": {
        // Squeaky popping + light thuds
        for (let i = 0; i < 4; i++) {
          const tOsc = ctx.createOscillator();
          const tGain = ctx.createGain();
          tOsc.connect(tGain);
          tGain.connect(ctx.destination);

          tOsc.type = "sine";
          const startS = now + i * 0.15;
          tOsc.frequency.setValueAtTime(700 - i * 80, startS);
          tOsc.frequency.exponentialRampToValueAtTime(1800, startS + 0.05);

          tGain.gain.setValueAtTime(0.0, now);
          tGain.gain.linearRampToValueAtTime(0.04, startS + 0.01);
          tGain.gain.linearRampToValueAtTime(0.001, startS + 0.05);

          tOsc.start(startS);
          tOsc.stop(startS + 0.05);
        }
        break;
      }

      case "rabbit_sleep":
        // Quiet rhythmic tiny breath puffs
        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.linearRampToValueAtTime(1020, now + 0.2);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      // ==================== HAMSTER SOUNDS ====================
      case "hamster_chirp": {
        // High rapid double squeaks "吱吱!"
        for (let i = 0; i < 2; i++) {
          const hOsc = ctx.createOscillator();
          const hGain = ctx.createGain();
          hOsc.connect(hGain);
          hGain.connect(ctx.destination);

          hOsc.type = "sine";
          const startS = now + i * 0.14;
          hOsc.frequency.setValueAtTime(2200, startS);
          hOsc.frequency.exponentialRampToValueAtTime(3200, startS + 0.04);
          hOsc.frequency.exponentialRampToValueAtTime(2400, startS + 0.1);

          hGain.gain.setValueAtTime(0.0, now);
          hGain.gain.linearRampToValueAtTime(0.06, startS + 0.02);
          hGain.gain.linearRampToValueAtTime(0.001, startS + 0.1);

          hOsc.start(startS);
          hOsc.stop(startS + 0.1);
        }
        break;
      }

      case "hamster_content":
        // Low squeak
        osc.type = "sine";
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case "hamster_chewing": {
        // Crunching loops "咔嚓咔嚓吧唧"
        for (let i = 0; i < 6; i++) {
          const crunch = createNoiseNode(ctx, "white", 0.06);
          const filter = ctx.createBiquadFilter();
          const nGain = ctx.createGain();

          filter.type = "bandpass";
          filter.frequency.setValueAtTime(2800 + i * 150, now + i * 0.15);

          nGain.gain.setValueAtTime(0.0, now);
          nGain.gain.linearRampToValueAtTime(0.08, now + i * 0.15 + 0.01);
          nGain.gain.linearRampToValueAtTime(0.001, now + i * 0.15 + 0.06);

          crunch.connect(filter);
          filter.connect(nGain);
          nGain.connect(ctx.destination);

          crunch.start(now + i * 0.15);
          crunch.stop(now + i * 0.15 + 0.06);
        }
        break;
      }

      case "hamster_sleep":
        // Soft rhythmic ultra quiet breath
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, now);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      // ==================== UNIVERSAL GESTURES SOUNDS ====================
      case "stardust_shrink":
        // High to low synthetic laser sweep "咻!"
        osc.type = "sine";
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case "stardust_bounce":
        // Synthetic damp thump thuds "咚咚"
        osc.type = "triangle";
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "stardust_grow":
        // Low to high sweep "呼!"
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.38);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
        break;

      case "stardust_lick":
        // Juicy wet slurp "吧唧吧唧"
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;

      case "stardust_flash":
        // Extremely crisp high bells "叮~"
        osc.type = "sine";
        osc.frequency.setValueAtTime(2936.65, now); // D7 high bell chime
        gain.gain.setValueAtTime(0.024, now); // -18dB quiet sparkle
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported in current container viewport rules:", e);
  }
}
