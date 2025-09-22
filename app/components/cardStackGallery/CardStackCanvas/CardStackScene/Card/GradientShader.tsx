import { useEffect, useMemo, useRef } from "react";
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

export const GradientMaskMaterial = ({
  texture,
  aspectRatio,
  opacity = 1,
}: {
  texture?: THREE.Texture;
  aspectRatio?: number;
  opacity?: number;
}) => {
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
    uniform float uOpacity;
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
      
      vec4 color = texture2D(uTexture, uv) * 4.0; // Center sample weighted more
      float blurAmount = (1.0 - mask) * 0.01;
      
      // Optimized 8-sample blur pattern
      color += texture2D(uTexture, uv + vec2(-blurAmount, -blurAmount));
      color += texture2D(uTexture, uv + vec2(0.0, -blurAmount));
      color += texture2D(uTexture, uv + vec2(blurAmount, -blurAmount));
      color += texture2D(uTexture, uv + vec2(-blurAmount, 0.0));
      color += texture2D(uTexture, uv + vec2(blurAmount, 0.0));
      color += texture2D(uTexture, uv + vec2(-blurAmount, blurAmount));
      color += texture2D(uTexture, uv + vec2(0.0, blurAmount));
      color += texture2D(uTexture, uv + vec2(blurAmount, blurAmount));

      
      color /= 12.0; // 4 + 8 samples
      color.a = mix(0.8, 1.0, mask) * uOpacity;

      gl_FragColor = color;
    }
  `;

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture || createFallbackTexture() },
      uAspectRatio: { value: aspectRatio },
      uMaskInset: { value: 0.2 },
      uOpacity: { value: opacity },
    }),
    []
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTexture.value = texture || createFallbackTexture();
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.uAspectRatio.value = aspectRatio;
    }
  }, [texture, opacity, aspectRatio]);

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
