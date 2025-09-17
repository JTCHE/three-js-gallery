// This hook handles scroll events and updates the scroll position with momentum.

export function useHandleScrollLogic(
  delta: number, 
  velocity: React.RefObject<number>, 
  setScrollPosition: (fn: (current: number) => number) => void,
  addVelocity = false
) {
  if (addVelocity) {
    velocity.current += delta * 0.3;
    velocity.current = Math.max(-2, Math.min(2, velocity.current));
  } else {
    setScrollPosition((current) => current + delta);
    velocity.current = 0;
  }
}