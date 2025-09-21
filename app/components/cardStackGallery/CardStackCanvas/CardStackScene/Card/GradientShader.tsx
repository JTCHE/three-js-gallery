import { useEffect, useRef } from "react";
import * as THREE from "three";

// Create shared fallback texture once
const createFallbackTexture = (() => {
  let texture: THREE.Texture | null = null;
  return () => {
    if (!texture) {
      const data = new Uint8Array([255, 255, 255, 0]);
      texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
      texture.needsUpdate = true;
    }
    return texture;
  };
})();

export const GradientMaskMaterial = ({ texture, aspectRatio }: { texture?: THREE.Texture; aspectRatio?: number }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

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

    // Optimized mask with smoother falloff using pow for better curve
    float createMask(vec2 uv, float inset) {
      vec2 d = min(uv, 1.0 - uv);
      float mask = min(d.x, d.y) / inset;
      return pow(clamp(mask, 0.0, 1.0), 0.6); // Smoother curve
    }

    void main() {
      vec2 uv = vUv;
      float mask = createMask(uv, 0.15);
      
      // Ultra-efficient 4-sample blur - works on any GPU
      float blurAmount = (1.0 - mask) * 0.01;
      vec4 color = texture2D(uTexture, uv);
      color += texture2D(uTexture, uv + vec2(blurAmount, 0.0));
      color += texture2D(uTexture, uv + vec2(-blurAmount, 0.0));
      color += texture2D(uTexture, uv + vec2(0.0, blurAmount));
      color += texture2D(uTexture, uv + vec2(0.0, -blurAmount));
      
      color *= 0.2; // /5 samples
      color.a = mix(0.8, 1.0, mask);

      gl_FragColor = color;
    }
  `;

  const uniforms = {
    uTexture: { value: texture || createFallbackTexture() },
    uAspectRatio: { value: aspectRatio },
    uMaskInset: { value: 0.2 },
  };

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTexture.value = texture || createFallbackTexture();
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
