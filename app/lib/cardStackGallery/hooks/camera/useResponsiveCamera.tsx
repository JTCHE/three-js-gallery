// Custom hook to adjust orthographic camera based on viewport aspect ratio
import { useEffect } from "react";
import * as THREE from "three";

export default function useResponsiveCamera(
  camera: THREE.Camera,
  size: { width: number; height: number },
  cameraPosition: [number, number, number],
  isAnimating: boolean,
  lookAtValue = new THREE.Vector3(0, 0.5, 0)
) {
  const viewportAspect = size.width / size.height;

  useEffect(() => {
    if (!camera || !THREE.OrthographicCamera.prototype.isPrototypeOf(camera)) return;

    const threeOrthographicCamera = camera as THREE.OrthographicCamera;
    const frustrumSize = 6;
    const isPortrait = viewportAspect <= 1;
    const isMobile = viewportAspect < 0.8;
    const portraitFactor = isMobile ? 0.3 : 0.45;

    if (isPortrait) {
      threeOrthographicCamera.left = -frustrumSize * portraitFactor;
      threeOrthographicCamera.right = frustrumSize * portraitFactor;
      threeOrthographicCamera.top = (frustrumSize / viewportAspect) * portraitFactor;
      threeOrthographicCamera.bottom = (-frustrumSize / viewportAspect) * portraitFactor;
    } else {
      threeOrthographicCamera.left = (-frustrumSize * viewportAspect) / 2;
      threeOrthographicCamera.right = (frustrumSize * viewportAspect) / 2;
      threeOrthographicCamera.top = frustrumSize / 2;
      threeOrthographicCamera.bottom = -frustrumSize / 2;
    }

    threeOrthographicCamera.updateProjectionMatrix();
    threeOrthographicCamera.lookAt(lookAtValue);
  }, [size, viewportAspect, camera, cameraPosition, isAnimating, lookAtValue]);
}
