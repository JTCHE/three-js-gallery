"use client";
import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Card, { CardProps } from "./Card/Card";
import { StackImagesArray } from "@/app/lib/cardStackGallery/fetchStackImages";
import findActiveCard from "@/app/lib/cardStackGallery/findActiveCard";
import useResponsiveCamera from "@/app/lib/cardStackGallery/hooks/camera/useResponsiveCamera";
import useInitEventListeners from "@/app/lib/cardStackGallery/hooks/gestures/useInitEventListeners";
import useTouchEnd from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchEnd";

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
    const cardData: Array<CardProps> = [];

    for (let i = centerIndex - renderDistance; i <= centerIndex + renderDistance; i++) {
      const imageIndex = ((i % imageCount) + imageCount) % imageCount;
      cardData.push({
        cardIndex: i,
        // cardIndex: imageIndex,
        imageUrl: images[imageIndex].src,
        cardTitle: images[imageIndex].title,
        zPosition: i * spacing,
        isActive: hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
        cardOwner: images[imageIndex].owner,
      });
    }
    return cardData;
  }, [Math.round(scrollPosition), hoveredIndex, hoverTimeout, imageCount, images, renderDistance, spacing, camera]);

  // Optimized mouse move handler with cached meshes
  const handleMouseMove = useCallback(
    (event : MouseEvent) => {
      if (isDragging.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);

      // Use cached meshes instead of traversing scene
      if (cardMeshes.current.length === 0) {
        // Only traverse once to build cache
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.userData && child.userData.cardIndex !== undefined) {
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
  const handleTouchEnd = useTouchEnd(isDragging, touchVelocity, velocity, gl);

  // Reset mesh cache when cards change (scroll or hover)
  useEffect(() => {
    cardMeshes.current = [];
  }, [scrollPosition, hoveredIndex]);

  // Set up event listeners
  useInitEventListeners(handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, throttledMouseMove);

  // Push active card title to context
  useEffect(() => {
    console.log(findActiveCard(cards)?.cardOwner);
  }, [cards, scrollPosition]);

  // Responsive camera adjustment
  useResponsiveCamera(camera, size);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[6, 7, 13]}
        near={0.001}
      />

      {cards.map((card) => (
        <Card
          key={card.cardIndex}
          zPosition={card.zPosition + stackOffset}
          cardIndex={card.cardIndex}
          isActive={card.isActive}
          imageUrl={card.imageUrl}
          cardTitle={card.cardTitle}
          cardOwner={card.cardOwner}
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
