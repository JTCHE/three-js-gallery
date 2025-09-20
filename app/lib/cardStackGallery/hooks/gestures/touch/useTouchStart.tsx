import { useCallback } from "react";

export default function useTouchStart(
  touchStartY: React.RefObject<number>,
  touchStartX: React.RefObject<number>,
  lastTouchY: React.RefObject<number>,
  isDragging: React.RefObject<boolean>,
  velocity: React.RefObject<number>,
  touchVelocity: React.RefObject<number>,
  lastTouchTime: React.RefObject<number>,
  gl: { domElement: HTMLElement }
) {
  return useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (isDragging.current) {
        event.preventDefault();
        return;
      }

      event.preventDefault();

      let clientY, clientX;
      if ("touches" in event && event.touches.length > 0) {
        clientY = event.touches[0].clientY;
        clientX = event.touches[0].clientX;
      } else {
        clientY = (event as MouseEvent).clientY;
        clientX = (event as MouseEvent).clientX;
      }

      touchStartY.current = clientY;
      touchStartX.current = clientX;
      lastTouchY.current = clientY;
      isDragging.current = true;
      velocity.current = 0;
      touchVelocity.current = 0;
      lastTouchTime.current = performance.now();
      gl.domElement.style.cursor = "grabbing";
    },
    [gl.domElement.style, isDragging, lastTouchTime, lastTouchY, touchStartX, touchStartY, touchVelocity, velocity]
  );
}
