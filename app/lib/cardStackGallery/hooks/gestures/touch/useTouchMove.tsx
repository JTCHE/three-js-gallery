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
  setScrollPosition: React.Dispatch<React.SetStateAction<number>>
) {
  return useCallback(
    (event: TouchEvent | MouseEvent) => {
      event.preventDefault();
      if (!isDragging.current) return;

      let clientY, clientX;
      if ("touches" in event && event.touches.length > 0) {
        clientY = event.touches[0].clientY;
        clientX = event.touches[0].clientX;
      } else {
        clientY = (event as MouseEvent).clientY;
        clientX = (event as MouseEvent).clientX;
      }

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTouchTime.current;
      const deltaY = clientY - lastTouchY.current;

      if (deltaTime > 0) {
        touchVelocity.current = (-deltaY / deltaTime) * 16;
      }

      const totalDeltaY = clientY - touchStartY.current;
      const totalDeltaX = clientX - touchStartX.current;

      if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX) && Math.abs(deltaY) > 2) {
        const scrollDelta = -deltaY * 0.01;
        // Use the utility function instead of the hook
        handleScrollLogic(scrollDelta, velocity, setScrollPosition, false);
      }

      lastTouchY.current = clientY;
      lastTouchTime.current = currentTime;
    },
    [velocity, setScrollPosition, isDragging, lastTouchTime, lastTouchY, touchStartY, touchStartX, touchVelocity]
  );
}
