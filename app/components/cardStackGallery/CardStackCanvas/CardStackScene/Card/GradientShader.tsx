import { useEffect, useRef } from "react";
import * as THREE from "three";

export const GradientMaskMaterial = ({ texture, aspectRatio }: { texture?: THREE.Texture; aspectRatio?: number }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // If no texture is provided, use a 1x1 white texture
  const fallbackTexture = useRef<THREE.Texture | null>(null);
  if (!fallbackTexture.current) {
    const transparentWhiteData = new Uint8Array([255, 255, 255, 0]);
    fallbackTexture.current = new THREE.DataTexture(transparentWhiteData, 1, 1, THREE.RGBAFormat);
    fallbackTexture.current.needsUpdate = true;
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uAspectRatio;
    uniform float uMaskInset;
    varying vec2 vUv;

    float createMask(vec2 uv, float inset) {
      float left = smoothstep(0.0, inset, uv.x);
      float right = smoothstep(1.0, 1.0 - inset, uv.x);
      float bottom = smoothstep(0.0, inset, uv.y);
      float top = smoothstep(1.0, 1.0 - inset, uv.y);
      return left * right * bottom * top;
    }

    void main() {
      vec2 uv = vUv;
      float mask = createMask(uv, 0.2);
      vec4 color = vec4(0.0);
      float blurAmount = (1.0 - mask) * 0.004;
      for(int x = -2; x <= 2; x++) {
        for(int y = -2; y <= 2; y++) {
          vec2 offset = vec2(float(x), float(y)) * blurAmount;
          color += texture2D(uTexture, uv + offset);
        }
      }
      color /= 25.0;
      color.a = mix(0.8, 1.0, mask);
      
      gl_FragColor = color;
    }
  `;

  const uniforms = {
    uTexture: { value: texture || fallbackTexture.current },
    uAspectRatio: { value: aspectRatio },
    uMaskInset: { value: 0.2 },
  };

  // Update uniform when texture changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTexture.value = texture || fallbackTexture.current;
    }
  }, [texture]);

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent={true}
      blending={THREE.NormalBlending}
    />
  );
};
