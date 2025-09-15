"use client";
import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Card from "./Card/Card";
import { StackImagesArray } from "@/app/lib/cardStackGallery/fetchStackImages";

export default function CardStackScene({ images }: { images: StackImagesArray }) {
  const imageCount = images.length;
  const spacing = 2.5;
  const renderDistance = 10;

  const [scrollPosition, setScrollPosition] = useState(0);
  const [stackOffset, setStackOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const { size, camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Cache card meshes to avoid scene traversal
  const cardMeshes = useRef<THREE.Mesh[]>([]);

  // Momentum scrolling state
  const velocity = useRef(0);
  const isScrolling = useRef(false);

  // Touch handling state
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);
  const lastTouchY = useRef(0);
  const touchVelocity = useRef(0);
  const lastTouchTime = useRef(0);

  // Memoize card generation - only regenerate when scroll position or hovered index changes
  const cards = useMemo(() => {
    const centerIndex = Math.round(scrollPosition);
    const cardData: Array<{
      index: number;
      imageIndex: number;
      imageUrl: string;
      imageTitle: string;
      baseZ: number;
      isActive: boolean;
    }> = [];

    for (let i = centerIndex - renderDistance; i <= centerIndex + renderDistance; i++) {
      const imageIndex = ((i % imageCount) + imageCount) % imageCount;
      cardData.push({
        index: i,
        imageIndex: imageIndex,
        imageUrl: images[imageIndex].src,
        imageTitle: images[imageIndex].title,
        baseZ: i * spacing,
        isActive: hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
      });
    }
    return cardData;
  }, [Math.round(scrollPosition), hoveredIndex, hoverTimeout, imageCount, images, renderDistance, spacing, camera]);

  // Optimized mouse move handler with cached meshes
  const handleMouseMove = useCallback(
    (event) => {
      if (isDragging.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      // Use cached meshes instead of traversing scene
      if (cardMeshes.current.length === 0) {
        // Only traverse once to build cache
        scene.traverse((child) => {
          if (child.isMesh && child.userData && child.userData.cardIndex !== undefined) {
            cardMeshes.current.push(child as THREE.Mesh);
          }
        });
      }

      const intersects = raycaster.current.intersectObjects(cardMeshes.current, false);

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      if (intersects.length > 0) {
        hoverTimeout.current = setTimeout(() => {
          const cardIndex = intersects[0].object.userData.cardIndex;
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

  // Throttled mouse move to reduce frequency
  const throttledMouseMove = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (event: MouseEvent) => {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
          handleMouseMove(event);
          timeoutId = null;
        }, 16); // ~60fps
      };
    })(),
    [handleMouseMove]
  );

  // Smooth stack movement with momentum
  useFrame((_, delta) => {
    const targetOffset = -scrollPosition * spacing;
    setStackOffset((current) => THREE.MathUtils.lerp(current, targetOffset, 0.1));

    // Apply momentum scrolling
    if (!isDragging.current && Math.abs(velocity.current) > 0.001) {
      isScrolling.current = true;

      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setScrollPosition((current) => {
        const next = current + velocity.current * delta * 60;
        if (isTouchDevice) {
          return Math.round(next);
        }
        return next;
      });

      const friction = isTouchDevice ? 0.2 : 0.7;
      velocity.current *= friction;

      if (Math.abs(velocity.current) < 0.001) {
        velocity.current = 0;
        isScrolling.current = false;
      }
    }
  });

  // Handle momentum-based scrolling
  const handleScroll = useCallback((delta, addVelocity = false) => {
    if (addVelocity) {
      velocity.current += delta * 0.3;
      velocity.current = Math.max(-2, Math.min(2, velocity.current));
    } else {
      setScrollPosition((current) => current + delta);
      velocity.current = 0;
    }
  }, []);

  // Handle mouse wheel with momentum
  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      const rawDelta = event.deltaY > 0 ? -0.5 : 0.5;
      const maxWheelSpeed = 0.5;
      const delta = Math.max(-maxWheelSpeed, Math.min(maxWheelSpeed, rawDelta));
      handleScroll(delta, true);
    },
    [handleScroll]
  );

  // Handle touch or mouse start
  const handleTouchStart = useCallback((event: MouseEvent | TouchEvent) => {
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

      if (deltaTime > 0) {
        touchVelocity.current = (-deltaY / deltaTime) * 16;
      }

      const totalDeltaY = clientY - touchStartY.current;
      const totalDeltaX = clientX - touchStartX.current;

      if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX) && Math.abs(deltaY) > 2) {
        const scrollDelta = -deltaY * 0.01;
        handleScroll(scrollDelta, false);
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
      velocity.current = touchVelocity.current * 0.1;
      velocity.current = Math.max(-3, Math.min(3, velocity.current));
    }
    gl.domElement.style.cursor = "grab";
    isDragging.current = false;
  }, []);

  // Reset mesh cache when cards change (scroll or hover)
  useEffect(() => {
    cardMeshes.current = [];
  }, [scrollPosition, hoveredIndex]);

  // Set up event listeners
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("mousedown", handleTouchStart, { passive: false });
      canvas.addEventListener("mousemove", handleTouchMove, { passive: false });
      canvas.addEventListener("mouseup", handleTouchEnd, { passive: false });
      canvas.addEventListener("mouseleave", handleTouchEnd, { passive: false });
      canvas.addEventListener("mousemove", throttledMouseMove, { passive: false });
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
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, throttledMouseMove]);

  // Push active card title to context
  useEffect(() => {
    const activeCard = cards.find((card) => card.isActive);
    if (activeCard) {
      console.log(activeCard.imageTitle);
    }
  }, [cards, scrollPosition]);

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
          key={card.index}
          zPosition={card.baseZ + stackOffset}
          index={card.index}
          isActive={card.isActive}
          imageUrl={card.imageUrl}
          imageTitle={card.imageTitle}
        />
      ))}

      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.5}
      />
    </>
  );
}
