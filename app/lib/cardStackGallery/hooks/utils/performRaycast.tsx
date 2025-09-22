// utils/raycasterUtils.ts
import * as THREE from "three";

export interface RaycastParams {
  event: MouseEvent | TouchEvent;
  isDragging: React.RefObject<boolean>;
  raycaster: React.RefObject<THREE.Raycaster>;
  mouse: React.RefObject<THREE.Vector2>;
  camera: THREE.Camera;
  scene: THREE.Scene;
  gl: { domElement: HTMLElement };
  cardMeshes: React.RefObject<THREE.Mesh[]>;
}

export interface RaycastResult {
  intersects: THREE.Intersection[];
  cardIndex: number | null;
  card: THREE.Mesh | null;
}

export function performRaycast(params: RaycastParams): RaycastResult | null {
  const { event, isDragging, raycaster, mouse, camera, scene, gl, cardMeshes } = params;

  if (isDragging.current) return null;

  const rect = gl.domElement.getBoundingClientRect();
  let clientX, clientY;

  if ("touches" in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ("changedTouches" in event && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else {
    clientX = (event as MouseEvent).clientX;
    clientY = (event as MouseEvent).clientY;
  }

  mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.current.setFromCamera(mouse.current, camera);

  // Build cache if needed
  if (cardMeshes.current.length === 0) {
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.userData && child.userData.cardIndex !== undefined) {
        cardMeshes.current.push(child as THREE.Mesh);
      }
    });
  }

  const intersects = raycaster.current.intersectObjects(cardMeshes.current, false);

  return {
    intersects,
    cardIndex: intersects.length > 0 ? intersects[0].object.userData.cardIndex : null,
    card: intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null,
  };
}
