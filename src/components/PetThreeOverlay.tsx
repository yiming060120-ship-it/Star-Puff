import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PetConfig } from "../types";
import { playSound } from "./AudioSynth";

interface PetThreeOverlayProps {
  dragOffset: React.MutableRefObject<{ x: number, y: number }>;
  isJumping: React.MutableRefObject<boolean>;
  activeGestureRef: React.MutableRefObject<"nod" | "wag" | "roll" | "jump" | "dance" | null>;
  petConfig: PetConfig;
}

export function PetThreeOverlay({ dragOffset, isJumping, activeGestureRef, petConfig }: PetThreeOverlayProps) {
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gltfLoadProgress, setGltfLoadProgress] = useState<number>(0);
  const [gltfLoadError, setGltfLoadError] = useState<string>("");
  const [isGltfLoading, setIsGltfLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!threeCanvasRef.current) return;

    const canvas = threeCanvasRef.current;
    
    // Resolve dynamic width and height
    const width = canvas.clientWidth || 440;
    const height = canvas.clientHeight || 320;

    // 1. Create Scene
    const scene = new THREE.Scene();
    // Transparent background
    scene.background = null; 

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.5);

    // 3. Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 4. Create Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffb5ff, 2.0); // Warm neon purple
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f3ff, 1.5); // Warm neon cyan
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 12);
    camera.add(pointLight);
    scene.add(camera);
    
    // --- STARDUST HOME REFINED 3D MODELING ---
    const homeGroup = new THREE.Group();
    scene.add(homeGroup);

    // 1. Crystal Base Platform (Floating Island)
    const baseGeo = new THREE.CylinderGeometry(2, 0.5, 0.5, 8);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a0f2e,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2,
      emissive: 0x0a0514,
      transparent: true,
      opacity: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.95;
    homeGroup.add(baseMesh);

    // 1.5 Outer Technological Ring Platform
    const outerRingGeo = new THREE.TorusGeometry(2.3, 0.03, 16, 64);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x2e073c,
      metalness: 0.9,
      roughness: 0.1,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.rotation.x = Math.PI / 2;
    outerRingMesh.position.y = -0.95;
    homeGroup.add(outerRingMesh);

    // 1.6 Inner Holographic Core
    const coreGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffb5ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.69;
    homeGroup.add(coreMesh);

    // 2. Glowing Pedestal Ring
    const ringGeo = new THREE.TorusGeometry(1.9, 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.6 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.69;
    homeGroup.add(ringMesh);

    // 3. Stardust Floating Crystals (Obelisks)
    const crystalGeo = new THREE.OctahedronGeometry(0.2, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffb5ff,
      emissive: 0xff69b4,
      emissiveIntensity: 0.5,
      transmission: 0.9,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.5,
    });
    const crystalWireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 });
    
    const crystals: THREE.Group[] = [];
    for (let i = 0; i < 7; i++) {
      const crystalGroup = new THREE.Group();
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      const crystalWire = new THREE.Mesh(crystalGeo, crystalWireMat);
      crystalWire.scale.setScalar(1.1); // Slightly larger for holographic outline
      crystalGroup.add(crystal);
      crystalGroup.add(crystalWire);

      const angle = (i / 7) * Math.PI * 2;
      const radius = 2.4;
      crystalGroup.position.set(Math.cos(angle) * radius, Math.random() * 0.8 - 0.4, Math.sin(angle) * radius);
      crystalGroup.rotation.set(Math.random(), Math.random(), Math.random());
      const cScale = 0.4 + Math.random() * 0.6;
      crystalGroup.scale.set(cScale, cScale * 1.5, cScale);
      crystals.push(crystalGroup);
      homeGroup.add(crystalGroup);
    }

    // 4. Sci-Fi Archway (Stargate)
    const archGeo = new THREE.TorusGeometry(2.5, 0.08, 16, 64, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x3d226a,
      metalness: 1.0,
      roughness: 0.2,
      emissive: 0x1a0f2e,
      emissiveIntensity: 0.5
    });
    const archMesh = new THREE.Mesh(archGeo, archMat);
    archMesh.position.set(0, -0.7, -1.5);
    archMesh.rotation.x = -Math.PI * 0.1;
    homeGroup.add(archMesh);

    // 5. Archway inner glowing energy line
    const archGlowGeo = new THREE.TorusGeometry(2.4, 0.02, 8, 64, Math.PI);
    const archGlowMat = new THREE.MeshBasicMaterial({ color: 0xff758c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const archGlowMesh = new THREE.Mesh(archGlowGeo, archGlowMat);
    archGlowMesh.position.set(0, -0.7, -1.45);
    archGlowMesh.rotation.x = -Math.PI * 0.1;
    homeGroup.add(archGlowMesh);
    
    // 6. Floating Background Stardust Points
    const envStardustGeo = new THREE.BufferGeometry();
    const envStardustCount = 80;
    const envStardustPos = new Float32Array(envStardustCount * 3);
    for (let i = 0; i < envStardustCount * 3; i++) {
      envStardustPos[i] = (Math.random() - 0.5) * 6;
    }
    envStardustGeo.setAttribute('position', new THREE.BufferAttribute(envStardustPos, 3));
    const envStardustMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const envStardust = new THREE.Points(envStardustGeo, envStardustMat);
    homeGroup.add(envStardust);

    // --- END STARDUST HOME ---

    // 6. Root group and raycasting setup
    const catGroup = new THREE.Group();
    scene.add(catGroup);
    
    // Add particle system for interaction feedback
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff69b4, 
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const maxParticles = 100;
    const positions = new Float32Array(maxParticles * 3);
    const velocities: THREE.Vector3[] = [];
    const lifetimes = new Float32Array(maxParticles);
    
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100; // Hidden initially
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3());
      lifetimes[i] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Load user's cat model from the uploaded photo
    setIsGltfLoading(true);
    setGltfLoadError("");
    setGltfLoadProgress(0);

    let catModel: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let clickReactionTime = 0;

    const imageUrl = petConfig.model3d?.sourceImage;
    
    if (imageUrl) {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(
        imageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          
          // Generate displacement map using Canvas
          const w = texture.image.width;
          const h = texture.image.height;
          
          const cvs = document.createElement('canvas');
          cvs.width = w;
          cvs.height = h;
          const ctx = cvs.getContext('2d');
          
          if (ctx) {
            // Clip to a circle just like the 2D version to remove the square edges
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(texture.image, 0, 0, w, h);
            
            const colorTexture = new THREE.CanvasTexture(cvs);
            colorTexture.colorSpace = THREE.SRGBColorSpace;
            
            // Create silhouette for displacement (downscaled for performance)
            const maxDispSize = 256;
            const scale = Math.min(maxDispSize / w, maxDispSize / h, 1);
            const dispW = Math.floor(w * scale);
            const dispH = Math.floor(h * scale);
            
            const silCvs = document.createElement('canvas');
            silCvs.width = dispW;
            silCvs.height = dispH;
            const silCtx = silCvs.getContext('2d');
            if (silCtx) {
              silCtx.drawImage(cvs, 0, 0, dispW, dispH);
              silCtx.globalCompositeOperation = 'source-in';
              silCtx.fillStyle = '#ffffff';
              silCtx.fillRect(0, 0, dispW, dispH);
              
              const blurCvs = document.createElement('canvas');
              blurCvs.width = dispW;
              blurCvs.height = dispH;
              const bCtx = blurCvs.getContext('2d');
              if (bCtx) {
                bCtx.fillStyle = '#000000';
                bCtx.fillRect(0, 0, dispW, dispH);
                bCtx.filter = `blur(${Math.floor(15 * scale)}px)`;
                bCtx.drawImage(silCvs, 0, 0);
                
                const dispTexture = new THREE.CanvasTexture(blurCvs);
                
                const aspect = w / h;
                const geoWidth = 2.5 * aspect;
                const geoHeight = 2.5;
                const geometry = new THREE.PlaneGeometry(geoWidth, geoHeight, 64, 64);
                
                const material = new THREE.MeshStandardMaterial({
                  map: colorTexture,
                  displacementMap: dispTexture,
                  displacementScale: 0.6,
                  alphaTest: 0.05,
                  transparent: true,
                  roughness: 0.8,
                  metalness: 0.1,
                  side: THREE.DoubleSide
                });
              
              const mesh = new THREE.Mesh(geometry, material);
              mesh.castShadow = false;
              mesh.receiveShadow = false;
              
              const group = new THREE.Group();
              group.add(mesh);
              // Initial positioning
              group.position.set(0, 0.2, 0);
              
              catModel = group;
              catGroup.add(group);
            }
          }
          }
          setIsGltfLoading(false);
        },
        (xhr) => {
          if (xhr.total > 0) {
            setGltfLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
          } else {
            setGltfLoadProgress((p) => Math.min(99, p + 10));
          }
        },
        (err) => {
          console.error(err);
          setGltfLoadError("无法生成 3D 高精模型");
          setIsGltfLoading(false);
        }
      );
    } else {
      setIsGltfLoading(false);
    }

    // 7. Orbit Controls & Raycaster
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit below ground slightly
    controls.target.set(0, 0, 0);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (catModel) {
        const intersects = raycaster.intersectObject(catModel, true);
        if (intersects.length > 0) {
          playSound('click');
          clickReactionTime = 1.0;
          
          const point = intersects[0].point;
          const posAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
          
          let spawned = 0;
          for (let i = 0; i < maxParticles && spawned < 15; i++) {
            if (lifetimes[i] <= 0) {
              posAttribute.setXYZ(i, point.x, point.y, point.z);
              velocities[i].set((Math.random() - 0.5) * 4, Math.random() * 4 + 2, (Math.random() - 0.5) * 4);
              lifetimes[i] = 1.0 + Math.random() * 0.5;
              spawned++;
            }
          }
          posAttribute.needsUpdate = true;
        }
      }
    };
    
    canvas.addEventListener('click', onMouseClick);

    // 8. Animation loop
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      controls.update();
      
      // Animate Stardust Home 3D elements
      if (homeGroup) {
        homeGroup.position.y = Math.sin(t * 1.5) * 0.05;
      }
      if (ringMesh) {
        ringMesh.rotation.z += dt * 0.5;
        (ringMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 3) * 0.2;
      }
      if (outerRingMesh) {
        outerRingMesh.rotation.z -= dt * 0.25;
      }
      if (coreMesh) {
        coreMesh.rotation.y += dt;
        (coreMesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 5) * 0.1;
      }
      if (archGlowMesh) {
        const glowMat = archGlowMesh.material as THREE.MeshBasicMaterial;
        glowMat.color.setHSL((t * 0.1) % 1, 0.8, 0.6 + Math.sin(t * 4) * 0.2);
      }
      if (crystals && crystals.length > 0) {
        crystals.forEach((crystalGroup, index) => {
          crystalGroup.rotation.y += dt * (0.5 + index * 0.1);
          crystalGroup.position.y = Math.sin(t * 2 + index) * 0.1 + 0.2;
        });
      }
      if (envStardust) {
        envStardust.rotation.y += dt * 0.05;
        envStardust.rotation.x = Math.sin(t * 0.1) * 0.1;
      }

      if (mixer) {
        mixer.update(dt);
      }

      // Read gesture states from refs
      const isJumpingState = isJumping.current;
      const gesture = activeGestureRef.current;
      const drag = dragOffset.current;

      // Gentle floating/wobbling animation + Gestures
      if (catModel) {
        let scaleM = 0.5;
        let rotY = Math.cos(t * 0.45) * 0.04 + (drag.x * 0.015);
        let rotX = drag.y * 0.015;
        let posY = -0.5 + Math.sin(t * 2.2) * 0.035;
        
        // Apply gesture modifiers
        if (isJumpingState || gesture === 'jump') {
          posY += Math.abs(Math.sin(t * 10)) * 0.5;
        } else if (gesture === 'nod') {
          rotX += Math.sin(t * 15) * 0.3;
        } else if (gesture === 'roll') {
          rotY += t * 5;
        } else if (gesture === 'dance') {
          rotY += Math.sin(t * 8) * 0.5;
          posY += Math.abs(Math.sin(t * 12)) * 0.2;
        }
        
        if (clickReactionTime > 0) {
          clickReactionTime -= dt * 2.5;
          const bounce = Math.sin(clickReactionTime * Math.PI) * 0.15;
          scaleM += bounce;
          posY += bounce * 0.5;
          rotY += bounce * 2.0; 
        }
        
        catModel.scale.set(scaleM, scaleM, scaleM);
        catModel.position.y = posY;
        catModel.rotation.y = rotY;
        catModel.rotation.x = rotX;
      }
      
      // Update Particles
      let particlesActive = false;
      const posAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < maxParticles; i++) {
        if (lifetimes[i] > 0) {
          particlesActive = true;
          lifetimes[i] -= dt;
          if (lifetimes[i] <= 0) {
             posAttribute.setY(i, -100); // Hide
          } else {
            const vx = velocities[i].x;
            const vy = velocities[i].y;
            const vz = velocities[i].z;
            
            const px = posAttribute.getX(i) + vx * dt;
            const py = posAttribute.getY(i) + vy * dt;
            const pz = posAttribute.getZ(i) + vz * dt;
            
            velocities[i].y -= 9.8 * dt;
            
            posAttribute.setXYZ(i, px, py, pz);
          }
        }
      }
      if (particlesActive) {
        posAttribute.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      const w = canvas.clientWidth || 440;
      const h = canvas.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      canvas.removeEventListener('click', onMouseClick);
      controls.dispose();
      renderer.dispose();
      if (particleGeometry) particleGeometry.dispose();
      if (particleMaterial) particleMaterial.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <canvas
        ref={threeCanvasRef}
        className="w-full h-full pointer-events-auto"
        style={{ background: 'transparent' }}
      />
      {/* Loading Overlay */}
      {isGltfLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-3 z-20 pointer-events-none">
          <div className="text-center space-y-1">
            <p className="text-xs font-mono text-gray-300 font-bold uppercase tracking-widest animate-pulse">
              正在搭载高精写实 3D 模型...
            </p>
            <p className="text-[10px] text-pink-400 font-mono">
              拉取模型数据：{gltfLoadProgress}%
            </p>
          </div>
          <div className="w-48 bg-white/10 h-1 rounded-full overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-150"
              style={{ width: `${gltfLoadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
