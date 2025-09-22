import { useEffect } from "react";

interface UseInitEventListenersParams {
  wheelEvent: (event: WheelEvent) => void;
  touchEvent: (event: MouseEvent | TouchEvent) => void;
  mouseEvent: (event: MouseEvent) => void;
}

export default function useInitEventListeners(
  handleWheel: UseInitEventListenersParams["wheelEvent"],
  handleTouchStart: UseInitEventListenersParams["touchEvent"],
  handleTouchMove: UseInitEventListenersParams["touchEvent"],
  handleTouchEnd: UseInitEventListenersParams["touchEvent"],
  throttledMouseMove: UseInitEventListenersParams["mouseEvent"],
  handleClick: UseInitEventListenersParams["mouseEvent"]
): void {
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("mousedown", handleTouchStart, { passive: false });
      canvas.addEventListener("mousemove", handleTouchMove, { passive: false });
      canvas.addEventListener("mouseup", handleTouchEnd, { passive: false });
      canvas.addEventListener("mouseleave", handleTouchEnd, { passive: false });
      canvas.addEventListener("mousemove", throttledMouseMove, { passive: false });
      canvas.addEventListener("click", handleClick, { passive: false });
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        canvas.removeEventListener("mousedown", handleTouchStart);
        canvas.removeEventListener("mousemove", handleTouchMove);
        canvas.removeEventListener("mouseup", handleTouchEnd);
        canvas.removeEventListener("mouseleave", handleTouchEnd);
        canvas.removeEventListener("mousemove", throttledMouseMove);
        canvas.removeEventListener("click", handleClick);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, throttledMouseMove]);
}
