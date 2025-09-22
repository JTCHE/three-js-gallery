import { useCallback } from "react";
import * as THREE from "three";
import { performRaycast } from "../utils/performRaycast";

export default function useClick(
  isDragging: React.RefObject<boolean>,
  raycaster: React.RefObject<THREE.Raycaster>,
  mouse: React.RefObject<THREE.Vector2>,
  camera: THREE.Camera,
  scene: THREE.Scene,
  gl: { domElement: HTMLElement },
  cardMeshes: React.RefObject<THREE.Mesh[]>,
  cards: Array<{ cardOwnerSlug: string; cardIndex: number }>,
  handleAnimationStart: (cardOwnerSlug: string, cardIndex: number) => void
) {
  return useCallback(
    (event: MouseEvent | TouchEvent) => {
      const result = performRaycast({
        event,
        isDragging,
        raycaster,  
        mouse,
        camera,
        scene,
        gl,
        cardMeshes,
      });

      if (!result || result.cardIndex === null) return;

      const card = cards.find((c) => c.cardIndex === result.cardIndex);

      if (card) {
        handleAnimationStart(card.cardOwnerSlug, card.cardIndex);
      }
    },
    [camera, gl, scene, cardMeshes, isDragging, mouse, raycaster, cards, handleAnimationStart]
  );
}
