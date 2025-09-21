"use client";
import { useVideoTexture } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GradientMaskMaterial } from "./GradientShader";
import useLazyTexture from "@/app/lib/cardStackGallery/hooks/textures/useLazyTexture";

export type CardProps = {
  imageWidth: number;
  imageHeight: number;
  zPosition: number;
  cardIndex: number;
  isActive: boolean;
  thumbnailUrl: string;
  placeholderUrl: string;
  snippetUrl: string | null;
  cardTitle: string;
  cardOwnerTitle?: string;
  cardOwnerSlug?: string;
  onClick: () => void;
  shouldLoadFull?: boolean;
};

export default function Card({
  imageWidth,
  imageHeight,
  zPosition,
  cardIndex,
  isActive,
  thumbnailUrl,
  snippetUrl,
  cardTitle,
  placeholderUrl,
  shouldLoadFull,

  onClick,
}: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [loadFullRes, setLoadFullRes] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);

  const placeholderTexture = useLoader(THREE.TextureLoader, placeholderUrl);
  const fullResTexture = useLazyTexture(thumbnailUrl, loadFullRes);

  const snippetTexture = snippetUrl ? useVideoTexture(snippetUrl) : null;

  const [currentTexture, setCurrentTexture] = useState(placeholderTexture);

  // Decide which texture resolution to use
  useEffect(() => {
    if (playVideo && snippetTexture) {
      setCurrentTexture(snippetTexture);
    } else if (fullResTexture) {
      setCurrentTexture(fullResTexture);
    } else {
      setCurrentTexture(placeholderTexture);
    }
  }, [playVideo, snippetTexture, fullResTexture, placeholderTexture]);

  // Decide when to load full resolution texture
  useEffect(() => {
    if (shouldLoadFull) {
      setLoadFullRes(true);
    } else {
      setLoadFullRes(false);
    }
  }, [shouldLoadFull]);

  // Handle video play/pause based on active state
  useEffect(() => {
    if (isActive && snippetTexture) {
      snippetTexture.image.currentTime = 0; // Reset to start
      setPlayVideo(true);
    } else if (!isActive && snippetTexture) {
      setPlayVideo(false);
    }
  }, [isActive, snippetTexture]);

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

  // Calculate aspect ratio
  useEffect(() => {
    if (imageWidth && imageHeight) {
      setAspectRatio(imageWidth / imageHeight);
    }
  }, [imageWidth, imageHeight]);

  // Calculate card dimensions based on aspect ratio
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
      <GradientMaskMaterial
        key={currentTexture.uuid}
        texture={currentTexture}
        aspectRatio={aspectRatio}
      />
    </mesh>
  );
}
