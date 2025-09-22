import React, { useCallback } from "react";
import { handleScrollLogic } from "../scroll/handleScrollLogic";

export default function useTouchMove(
  isDragging: React.RefObject<boolean>,
  lastTouchTime: React.RefObject<number>,
  lastTouchY: React.RefObject<number>,
  touchStartY: React.RefObject<number>,
  touchStartX: React.RefObject<number>,
  touchVelocity: React.RefObject<number>,
  velocity: React.RefObject<number>,
  setScrollPosition: React.Dispatch<React.SetStateAction<number>>,
  gl: { domElement: HTMLElement }
) {
  return useCallback(
    (event: TouchEvent | MouseEvent) => {
      let clientY, clientX;
      if ("touches" in event && event.touches.length > 0) {
        clientY = event.touches[0].clientY;
        clientX = event.touches[0].clientX;
      } else {
        clientY = (event as MouseEvent).clientY;
        clientX = (event as MouseEvent).clientX;
      }

      const totalDeltaY = clientY - touchStartY.current;
      const totalDeltaX = clientX - touchStartX.current;
      const moveDistance = Math.sqrt(totalDeltaY * totalDeltaY + totalDeltaX * totalDeltaX);

      // For touch events, check if we should start dragging
      if ("touches" in event && !isDragging.current && moveDistance > 5) {
        isDragging.current = true;
        gl.domElement.style.cursor = "grabbing";
      }

      // Only proceed if we're dragging
      if (!isDragging.current) return;

      event.preventDefault();

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTouchTime.current;
      const deltaY = clientY - lastTouchY.current;

      if (deltaTime > 0) {
        touchVelocity.current = (-deltaY / deltaTime) * 16;
      }

      if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX) && Math.abs(deltaY) > 2) {
        const scrollDelta = -deltaY * 0.01;
        handleScrollLogic(scrollDelta, velocity, setScrollPosition, false);
      }

      lastTouchY.current = clientY;
      lastTouchTime.current = currentTime;
    },
    [velocity, setScrollPosition, isDragging, lastTouchTime, lastTouchY, touchStartY, touchStartX, touchVelocity, gl.domElement.style]
  );
}