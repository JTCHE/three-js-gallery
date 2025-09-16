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
        }}
        style={{ touchAction: "none", width: "100%", height: "100%" }}
      >
        <CardStackScene images={images} />
      </Canvas>
  );
}
