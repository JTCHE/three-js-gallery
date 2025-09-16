"use client";
import { useFrame, useLoader } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GradientMaskMaterial } from "./GradientShader";

export type CardProps = {
  zPosition: number;
  cardIndex: number;
  isActive: boolean;
  imageUrl: string;
  cardTitle: string;
  cardOwner: string;
};

export default function Card({ zPosition, cardIndex, isActive, imageUrl, cardTitle, cardOwner, baseZ }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const texture = useLoader(THREE.TextureLoader, imageUrl);

  useEffect(() => {
    if (texture && texture.image) {
      const img = texture.image;
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
      setImageLoaded(true);
    }
  }, [texture]);

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

  const boxWidth = aspectRatio > 1 ? 2 * aspectRatio : 2;
  const boxHeight = aspectRatio > 1 ? 2 : 2 / aspectRatio;

  const maxDimension = 3;
  const scaleFactor = Math.min(maxDimension / boxWidth, maxDimension / boxHeight);
  const cardWidth = boxWidth * scaleFactor;
  const cardHeight = boxHeight * scaleFactor;

  const router = useRouter();

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={[1.2, 1.2, 1]}
      onClick={() => router.push(`/cardIndex/${cardTitle}`)}
      userData={{ cardIndex: cardIndex, cardTitle: cardTitle }}
    >
      <boxGeometry args={[cardWidth, cardHeight, 0.035]} />
      <GradientMaskMaterial
        texture={texture}
        aspectRatio={aspectRatio}
      />
    </mesh>
  );
}
