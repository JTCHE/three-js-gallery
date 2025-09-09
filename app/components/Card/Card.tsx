"use client";
import { useLoader, useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { GradientMaskMaterial } from "./GradientShader";
import * as THREE from "three";

type CardProps = {
  zPosition: number;
  index: number;
  isActive: boolean;
  imageUrl: string;
  imageTitle: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function Card({ zPosition, index, isActive, imageUrl, imageTitle, onMouseEnter, onMouseLeave }: CardProps) {
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
  const finalWidth = boxWidth * scaleFactor;
  const finalHeight = boxHeight * scaleFactor;

  const router = useRouter();

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={() => router.push(`/index/${imageTitle}`)}
    >
      <boxGeometry args={[finalWidth, finalHeight, 0.035]} />
      <GradientMaskMaterial
        texture={texture}
        aspectRatio={aspectRatio}
      />
    </mesh>
  );
}
