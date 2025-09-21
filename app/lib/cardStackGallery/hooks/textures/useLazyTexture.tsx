import { useState, useEffect } from "react";
import * as THREE from "three";

export default function useLazyTexture(url: string, shouldLoad: boolean) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!shouldLoad || isLoaded) return;

    const loader = new THREE.TextureLoader();
    loader.load(url, (loadedTexture) => {
      setTexture(loadedTexture);
      setIsLoaded(true);
    });

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [url, shouldLoad, isLoaded, texture]);

  return texture;
}
