"use client";
import { Canvas } from "@react-three/fiber";
import CardStackScene from "./cardStackScene/CardStackScene";

// Main Component Export
export default function CardStack() {
  return (
    <div className="w-full h-screen overflow-hidden touch-none">
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
        <CardStackScene />
      </Canvas>
    </div>
  );
}
