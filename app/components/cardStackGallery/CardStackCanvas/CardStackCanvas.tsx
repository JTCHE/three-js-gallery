"use client";
import { StackImagesArray } from "@/app/lib/cardStackGallery/fetchStackImages";
import { Canvas } from "@react-three/fiber";
import CardStackScene from "./CardStackScene/CardStackScene";

export default function CardStackCanvas({ images }: { images: StackImagesArray }) {
  if (!images || images.length === 0) return null;
  return (
    <Canvas
      className="w-full h-full"
      gl={{
        antialias: true,
        alpha: false,
      }}
      style={{ touchAction: "none" }}
    >
      <color
        attach="background"
        args={["white"]}
      />
      <CardStackScene images={images} />
    </Canvas>
  );
}
