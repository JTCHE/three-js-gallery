import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { images } from "../../lib/imgArray";
import Card from "../Card/Card";

export default function CardStackScene() {
  const imageCount = images.length;
  const spacing = 2.5;
  const renderDistance = 10;

  const [scrollPosition, setScrollPosition] = useState(0);
  const [stackOffset, setStackOffset] = useState(0);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);
  console.log("Hovered Title:", hoveredTitle);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const { size, camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Momentum scrolling state
  const velocity = useRef(0);
  const lastTime = useRef(0);
  const isScrolling = useRef(false);

  // Touch handling state
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);
  const lastTouchY = useRef(0);
  const touchVelocity = useRef(0);
  const lastTouchTime = useRef(0);

  // Generate infinite card positions
  const generateCards = () => {
    const cards: Array<{
      index: number;
      imageIndex: number;
      imageUrl: string;
      imageTitle: string;
      baseZ: number;
      isActive: boolean;
    }> = [];
    const centerIndex = Math.round(scrollPosition);

    for (let i = centerIndex - renderDistance; i <= centerIndex + renderDistance; i++) {
      const imageIndex = ((i % imageCount) + imageCount) % imageCount; // wrap around
      cards.push({
        index: i,
        imageIndex: imageIndex,
        imageUrl: images[imageIndex].src,
        imageTitle: images[imageIndex].title,
        baseZ: i * spacing,
        isActive: hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
      });
    }
    return cards;
  };

  const cards = generateCards();

  const handleMouseMove = useCallback(
    (event) => {
      if (isDragging.current) return; // Ignore hover if dragging

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      const cardMeshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.cardIndex !== undefined) {
          cardMeshes.push(child as THREE.Mesh);
        }
      });

      const intersects = raycaster.current.intersectObjects(cardMeshes, false);

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      if (intersects.length > 0) {
        hoverTimeout.current = setTimeout(() => {
          const cardIndex = intersects[0].object.userData.cardIndex;
          const imageTitle = intersects[0].object.userData.imageTitle;
          setHoveredIndex(cardIndex);
          gl.domElement.style.cursor = "pointer";
        }, 7);
      } else {
        hoverTimeout.current = setTimeout(() => {
          setHoveredIndex(null);
        }, 300);
        gl.domElement.style.cursor = "grab";
      }
    },
    [camera, gl, scene]
  );

  // smooth stack movement with momentum
  useFrame((_, delta) => {
    const targetOffset = -scrollPosition * spacing;
    setStackOffset((current) => THREE.MathUtils.lerp(current, targetOffset, 0.1));

    // apply momentum scrolling
    if (!isDragging.current && Math.abs(velocity.current) > 0.001) {
      isScrolling.current = true;

      // apply velocity to scroll position
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setScrollPosition((current) => {
        const next = current + velocity.current * delta * 60;
        if (isTouchDevice) {
          return Math.round(next);
        }
        return next;
      });
      // adjust these values to control momentum behavior
      const friction = 0.75; // Higher = less friction, more momentum
      velocity.current *= friction;

      // stop momentum when velocity is very small
      if (Math.abs(velocity.current) < 0.001) {
        velocity.current = 0;
        isScrolling.current = false;
      }
    }
  });

  // Handle momentum-based scrolling
  const handleScroll = useCallback((delta, addVelocity = false) => {
    if (addVelocity) {
      // Add to existing velocity for momentum
      velocity.current += delta * 0.3; // Adjust multiplier for sensitivity
      // Clamp velocity to prevent excessive speeds
      velocity.current = Math.max(-2, Math.min(2, velocity.current));
    } else {
      // Direct scroll (for wheel events)
      setScrollPosition((current) => current + delta);
      velocity.current = 0; // Reset momentum on direct scroll
    }
  }, []);

  // Handle mouse wheel with momentum
  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      // Clamp wheel delta to max speed
      const rawDelta = event.deltaY > 0 ? -0.5 : 0.5;
      const maxWheelSpeed = 0.5;
      const delta = Math.max(-maxWheelSpeed, Math.min(maxWheelSpeed, rawDelta));
      handleScroll(delta, true); // Enable momentum for wheel events
    },
    [handleScroll]
  );

  // Handle touch or mouse start
  const handleTouchStart = useCallback((event: MouseEvent | TouchEvent) => {
    // Prevent link navigation if dragging
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
    velocity.current = 0; // Stop momentum when user starts dragging
    touchVelocity.current = 0;
    lastTouchTime.current = performance.now();
    gl.domElement.style.cursor = "grabbing";
  }, []);

  // Handle touch or mouse move with velocity tracking
  const handleTouchMove = useCallback(
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

      // Calculate velocity for momentum
      if (deltaTime > 0) {
        touchVelocity.current = (-deltaY / deltaTime) * 16; // Convert to 60fps equivalent, reversed
      }

      // Only handle vertical swipes
      const totalDeltaY = clientY - touchStartY.current;
      const totalDeltaX = clientX - touchStartX.current;

      if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX) && Math.abs(deltaY) > 2) {
        const scrollDelta = -deltaY * 0.01; // Adjust sensitivity, reversed
        handleScroll(scrollDelta, false); // Direct scroll during drag
      }

      lastTouchY.current = clientY;
      lastTouchTime.current = currentTime;
    },
    [handleScroll]
  );

  // Handle touch or mouse end with momentum application
  const handleTouchEnd = useCallback((event) => {
    event.preventDefault();
    if (isDragging.current) {
      // Apply momentum based on touch velocity
      velocity.current = touchVelocity.current * 0.1; // Adjust momentum strength
      // Clamp velocity
      velocity.current = Math.max(-3, Math.min(3, velocity.current));
    }
    gl.domElement.style.cursor = "grab";
    isDragging.current = false;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      // Mouse wheel events
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      // Mouse drag events
      canvas.addEventListener("mousedown", handleTouchStart, { passive: false });
      canvas.addEventListener("mousemove", handleTouchMove, { passive: false });
      canvas.addEventListener("mouseup", handleTouchEnd, { passive: false });
      canvas.addEventListener("mouseleave", handleTouchEnd, { passive: false });
      canvas.addEventListener("mousemove", handleMouseMove, { passive: false });
      // Touch events for mobile
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        canvas.removeEventListener("mousedown", handleTouchStart);
        canvas.removeEventListener("mousemove", handleTouchMove);
        canvas.removeEventListener("mouseup", handleTouchEnd);
        canvas.removeEventListener("mouseleave", handleTouchEnd);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseMove]);

  const viewportAspect = size.width / size.height;

  useEffect(() => {
    if (!camera || !THREE.OrthographicCamera.prototype.isPrototypeOf(camera)) return;

    const threeOrthographicCamera = camera as THREE.OrthographicCamera;
    const frustrumSize = 8;
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
    threeOrthographicCamera.lookAt(0, 0.5, 0);
  }, [size, viewportAspect, camera]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[6, 7, 13]}
        near={0.001}
      />

      {cards.map((card) => (
        <Card
          key={`${card.index}-${card.imageUrl}`}
          zPosition={card.baseZ + stackOffset}
          index={card.index}
          isActive={card.isActive}
          imageUrl={card.imageUrl}
          imageTitle={card.imageTitle}
        />
      ))}

      {/* Subtle ambient lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.5}
      />
    </>
  );
}
