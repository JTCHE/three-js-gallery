import { useCallback } from "react";
import * as THREE from "three";
import { performRaycast } from "../../utils/performRaycast";

export default function useMouseHover(
  isDragging: React.RefObject<boolean>,
  raycaster: React.RefObject<THREE.Raycaster>,
  mouse: React.RefObject<THREE.Vector2>,
  camera: THREE.Camera,
  scene: THREE.Scene,
  gl: { domElement: HTMLElement },
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>,
  cardMeshes: React.RefObject<THREE.Mesh[]>,
  hoverTimeout: React.RefObject<NodeJS.Timeout | null>
) {
  return useCallback(
    (event: MouseEvent) => {
      const result = performRaycast({ event, isDragging, raycaster, mouse, camera, scene, gl, cardMeshes });

      if (!result) return;

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      if (result.cardIndex !== null) {
        hoverTimeout.current = setTimeout(() => {
          setHoveredIndex(result.cardIndex);
          gl.domElement.style.cursor = "pointer";
        }, 7);
      } else {
        hoverTimeout.current = setTimeout(() => {
          setHoveredIndex(null);
        }, 200);
        gl.domElement.style.cursor = "grab";
      }
    },
    [camera, gl, scene, cardMeshes, isDragging, mouse, raycaster, setHoveredIndex, hoverTimeout]
  );
}
