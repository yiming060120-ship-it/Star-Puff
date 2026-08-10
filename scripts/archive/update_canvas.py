import re
with open("src/components/HomeCanvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# add imports
import_str = "import { Canvas } from '@react-three/fiber';\nimport { OrbitControls } from '@react-three/drei';\n"
content = import_str + content

# replace the canvas block
old_canvas_block = r"""          {useReal3D && \(
            <PetThreeOverlay 
              dragOffset={dragOffset}
              isJumping={isJumping}
              activeGestureRef={activeGestureRef}
              petConfig={petConfig}
            />
          \)}
          <canvas
            ref={canvasRef}
            width={440}
            height={320}
            className="w-full h-auto cursor-pointer select-none border-b border-white/5 transition-transform duration-100"
            id="rendering-canvas-viewport"
          />"""

new_canvas_block = """          <div className="w-full h-[320px] relative">
            <Canvas
              className="w-full h-full cursor-pointer select-none border-b border-white/5 transition-transform duration-100"
              id="rendering-canvas-viewport"
              camera={{ position: [0, 0, 5] }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 10]} intensity={1} />
              <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="red" />
              </mesh>
              <OrbitControls />
            </Canvas>
          </div>"""

# we need to be careful with regex, let's just do a string replacement
old_canvas_exact = """          {useReal3D && (
            <PetThreeOverlay 
              dragOffset={dragOffset}
              isJumping={isJumping}
              activeGestureRef={activeGestureRef}
              petConfig={petConfig}
            />
          )}
          <canvas
            ref={canvasRef}
            width={440}
            height={320}
            className="w-full h-auto cursor-pointer select-none border-b border-white/5 transition-transform duration-100"
            id="rendering-canvas-viewport"
          />"""

content = content.replace(old_canvas_exact, new_canvas_block)

with open("src/components/HomeCanvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated!")
