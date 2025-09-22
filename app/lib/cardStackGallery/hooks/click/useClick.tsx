import { useCallback } from "react";
import * as THREE from "three";

export default function useClick(
  isDragging: React.RefObject<boolean>,
  raycaster: React.RefObject<THREE.Raycaster>,
  mouse: React.RefObject<THREE.Vector2>,
  camera: THREE.Camera,
  scene: THREE.Scene,
  gl: { domElement: HTMLElement },
  setHoveredIndex: React.Dispatch<React.SetStateAction<number | null>>,
  cardMeshes: React.RefObject<THREE.Mesh[]>,
  cards: Array<{ cardOwnerSlug: string; cardIndex: number }>,
  handleAnimationStart: (cardOwnerSlug: string, cardIndex: number) => void
) {
  return useCallback(
    (event: MouseEvent) => {
      if (isDragging.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      // Use cached meshes instead of traversing scene
      if (cardMeshes.current.length === 0) {
        // Only traverse once to build cache
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.userData && child.userData.cardIndex !== undefined) {
            cardMeshes.current.push(child as THREE.Mesh);
          }
        });
      }

      const intersects = raycaster.current.intersectObjects(cardMeshes.current, false);

      if (intersects.length > 0) {
        const cardIndex = intersects[0].object.userData.cardIndex;
        const card = cards.find((c) => c.cardIndex === cardIndex);

        if (card) {
          handleAnimationStart(card.cardOwnerSlug, card.cardIndex);
        }
      }
    },
    [camera, gl, scene, cardMeshes, isDragging, mouse, raycaster, setHoveredIndex]
  );
}
