import { useRef } from "react";
import * as THREE from "three";

export const GradientMaskMaterial = ({ texture, aspectRatio }) => {
  const materialRef = useRef();

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
      // Calculate distance from edges
      float left = smoothstep(0.0, inset, uv.x);
      float right = smoothstep(1.0, 1.0 - inset, uv.x);
      float bottom = smoothstep(0.0, inset, uv.y);
      float top = smoothstep(1.0, 1.0 - inset, uv.y);
      
      // Combine all edges to create rectangular gradient
      return left * right * bottom * top;
    }

    void main() {
      vec2 uv = vUv;
      
      // Create the gradient mask (0.2 = 20% inset)
      float mask = createMask(uv, 0.2);
      
      // Sample the texture multiple times with slight offsets for blur effect
      vec4 color = vec4(0.0);
      float blurAmount = (1.0 - mask) * 0.004; // Blur intensity based on mask
      
      // Simple box blur - sample texture with offsets
      for(int x = -2; x <= 2; x++) {
        for(int y = -2; y <= 2; y++) {
          vec2 offset = vec2(float(x), float(y)) * blurAmount;
          color += texture2D(uTexture, uv + offset);
        }
      }
      color /= 25.0; // Average the samples (5x5 = 25 samples)
      
      // Apply the mask for opacity
      color.a = mix(0.8, 1.0, mask); 

      gl_FragColor = color;
    }
  `;

  const uniforms = {
    uTexture: { value: texture },
    uAspectRatio: { value: aspectRatio },
    uMaskInset: { value: 0.2 },
  };

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
