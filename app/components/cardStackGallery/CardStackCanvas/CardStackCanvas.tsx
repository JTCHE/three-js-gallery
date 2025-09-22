"use client";
import { StackImagesArray } from "@/app/lib/cardStackGallery/fetchStackImages";
import { Canvas } from "@react-three/fiber";
import CardStackScene from "./CardStackScene/CardStackScene";

export default function CardStackCanvas({ images }: { images: StackImagesArray }) {
  if (!images || images.length === 0) return null;

  return (
    <Canvas
      gl={{
        antialias: true,
        depth: false,
        powerPreference: "high-performance",
        alpha: true,
      }}
      style={{
        touchAction: "none",
      }}
    >
      <CardStackScene images={images} />
    </Canvas>
  );
}
