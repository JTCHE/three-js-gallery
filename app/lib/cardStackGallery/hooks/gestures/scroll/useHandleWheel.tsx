// This hook handles mouse wheel events for scrolling with momentum.
// It normalizes the wheel delta and applies a maximum speed limit.

import { useCallback } from "react";
import { useHandleScrollLogic } from "./useHandleScroll";

export type handleWheelProps = {
  velocity: React.RefObject<number>;
  setScrollPosition: React.Dispatch<React.SetStateAction<number>>;
};

export default function useHandleWheel(velocity: handleWheelProps["velocity"], setScrollPosition: handleWheelProps["setScrollPosition"]) {
  return useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const rawDelta = event.deltaY > 0 ? -0.5 : 0.5;
      const maxWheelSpeed = 0.5;
      const delta = Math.max(-maxWheelSpeed, Math.min(maxWheelSpeed, rawDelta));
      useHandleScrollLogic(delta, velocity, setScrollPosition, true);
    },
    [velocity, setScrollPosition]
  );
}