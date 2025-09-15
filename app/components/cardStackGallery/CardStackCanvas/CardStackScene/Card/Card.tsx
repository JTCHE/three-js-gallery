"use client";
import { useFrame, useLoader } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GradientMaskMaterial } from "./GradientShader";

type CardProps = {
  zPosition: number;
  index: number;
  isActive: boolean;
  imageUrl: string;
  imageTitle: string;
};

export default function Card({ zPosition, index, isActive, imageUrl, imageTitle }: CardProps) {
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
      onClick={() => router.push(`/index/${imageTitle}`)}
      userData={{ cardIndex: index, imageTitle: imageTitle }}
    >
      <boxGeometry args={[cardWidth, cardHeight, 0.035]} />
      <GradientMaskMaterial
        texture={texture}
        aspectRatio={aspectRatio}
      />
    </mesh>
  );
}
