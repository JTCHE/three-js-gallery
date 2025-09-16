import { useCallback } from "react";

export default function useTouchEnd(
  isDragging: React.RefObject<boolean>,
  touchVelocity: React.RefObject<number>,
  velocity: React.RefObject<number>,
  gl: { domElement: HTMLElement }
) {
  return useCallback((event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    if (isDragging.current) {
      velocity.current = touchVelocity.current * 0.1;
      velocity.current = Math.max(-3, Math.min(3, velocity.current));
    }
    gl.domElement.style.cursor = "grab";
    isDragging.current = false;
  }, []);
}
