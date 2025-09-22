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

      let clientY, clientX;
      if ("touches" in event && event.touches.length > 0) {
        clientY = event.touches[0].clientY;
        clientX = event.touches[0].clientX;
        // For touch, don't preventDefault yet - wait for movement
      } else {
        clientY = (event as MouseEvent).clientY;
        clientX = (event as MouseEvent).clientX;
        // For mouse, immediately start dragging
        event.preventDefault();
        isDragging.current = true;
        gl.domElement.style.cursor = "grabbing";
      }

      touchStartY.current = clientY;
      touchStartX.current = clientX;
      lastTouchY.current = clientY;
      velocity.current = 0;
      touchVelocity.current = 0;
      lastTouchTime.current = performance.now();
    },
    [gl.domElement.style, isDragging, lastTouchTime, lastTouchY, touchStartX, touchStartY, touchVelocity, velocity]
  );
}
