import { useVideoTexture } from "@react-three/drei";
import { useState, useEffect } from "react";
import { GradientMaskMaterial } from "./GradientShader";
import * as THREE from "three";

export default function VideoMaterial({  url,
  aspectRatio,
  fallbackTexture,
  isActive,
}: {
  url: string;
  aspectRatio: number;
  fallbackTexture: THREE.Texture;
  isActive: boolean;
}) {
  const texture = useVideoTexture(url, { start: true, crossOrigin: "anonymous" });
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (texture?.image && texture.image.readyState >= 2) {
      setVideoReady(true);
    } else {
      setVideoReady(false);
    }
  }, [texture]);

  // Reset video to start when resetOnActive changes to true
  useEffect(() => {
    if (isActive && texture?.image && typeof texture.image.currentTime === "number") {
      texture.image.currentTime = 0;
      texture.image.play?.();
    }
  }, [isActive, texture]);

  return (
    <GradientMaskMaterial
      aspectRatio={aspectRatio}
      texture={videoReady ? texture : fallbackTexture}
    />
  );
}
