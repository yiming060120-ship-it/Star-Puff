import re
with open("src/components/HomeCanvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix imports
content = content.replace("import { OrbitControls } from '@react-three/drei';", "import { OrbitControls, useGLTF } from '@react-three/drei';")
content = content.replace('import React, { useEffect, useRef, useState } from "react";', 'import React, { useEffect, useRef, useState, Suspense } from "react";')

# Define Model component right after imports
model_component = """
// 这是一个加载 3D 模型的自定义组件
function PetModel() {
  // 从 public/models/pet.glb 加载模型
  const { scene } = useGLTF('/models/pet.glb');
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}
"""
content = content.replace("/**", model_component + "\n/**", 1)

# Replace the mesh with Suspense and the Model component
old_mesh = """              <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color="red" />
              </mesh>"""

new_mesh = """              <Suspense fallback={
                <mesh>
                  <sphereGeometry args={[1, 32, 32]} />
                  <meshStandardMaterial color="red" wireframe={true} />
                </mesh>
              }>
                <PetModel />
              </Suspense>"""

content = content.replace(old_mesh, new_mesh)

with open("src/components/HomeCanvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated model logic!")
