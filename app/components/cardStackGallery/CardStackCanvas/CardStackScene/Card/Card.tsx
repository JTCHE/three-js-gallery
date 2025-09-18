"use client";
import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GradientMaskMaterial } from "./GradientShader";
import VideoMaterial from "./VideoMaterial";

export type CardProps = {
  zPosition: number;
  cardIndex: number;
  isActive: boolean;
  thumbnailUrl: string;
  snippetUrl: string | null;
  cardTitle: string;
  cardOwnerTitle?: string;
  cardOwnerSlug?: string;
  onClick: () => void;
};

export default function Card({ zPosition, cardIndex, isActive, thumbnailUrl, snippetUrl, cardTitle, onClick }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [textureReady, setTextureReady] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  const texture = useLoader(THREE.TextureLoader, thumbnailUrl);

  // Determine if the snippet is a video
  const isVideo = useMemo(() => {
    if (!snippetUrl) return false;
    const extension = snippetUrl.split(".").pop()?.toLowerCase();
    return extension === "mp4";
  }, [snippetUrl]);

  // Set aspect ratio when texture loads
  useEffect(() => {
    if (texture && texture.image) {
      const img = texture.image;
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
      setTextureReady(true);
    }
  }, [texture, snippetUrl]);

  useFrame(() => {
    if (meshRef.current) {
      // Smooth scale animation
      const targetScale = isActive ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);

      // Smooth Y position animation
      const targetY = isActive ? 1.25 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);

      // Set Z position directly
      meshRef.current.position.z = zPosition;
    }
  });

  // Calculate card dimensions
  const { cardWidth, cardHeight } = useMemo(() => {
    const boxWidth = aspectRatio > 1 ? 2 * aspectRatio : 2;
    const boxHeight = aspectRatio > 1 ? 2 : 2 / aspectRatio;
    const maxDimension = 3;
    const scaleFactor = Math.min(maxDimension / boxWidth, maxDimension / boxHeight);

    return {
      cardWidth: boxWidth * scaleFactor,
      cardHeight: boxHeight * scaleFactor,
    };
  }, [aspectRatio]);

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={[1.2, 1.2, 1]}
      onClick={() => onClick()}
      userData={{ cardIndex, cardTitle }}
    >
      <boxGeometry args={[cardWidth, cardHeight, 0.035]} />
      <Suspense
        fallback={
          <GradientMaskMaterial
            texture={texture}
            aspectRatio={aspectRatio}
          />
        }
      >
        {snippetUrl && isActive ? (
          <VideoMaterial
            url={snippetUrl}
            aspectRatio={aspectRatio}
            fallbackTexture={texture}
            isActive={isActive}
          />
        ) : (
          <GradientMaskMaterial
            texture={texture}
            aspectRatio={aspectRatio}
          />
        )}
      </Suspense>
    </mesh>
  );
}

// WIP : when video first becomes active, it loads but doesn't play immediately.
// On subsequent activations, it plays fine.
// Not sure if it's a react-three-fiber issue or something else.
