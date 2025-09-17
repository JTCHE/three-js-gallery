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
import useTouchMove from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchMove";
import useHandleWheel from "@/app/lib/cardStackGallery/hooks/gestures/scroll/useHandleWheel";
import useTouchStart from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchStart";
import useMouseHover from "@/app/lib/cardStackGallery/hooks/gestures/hover/useMouseHover";
import useMemoizeCards from "@/app/lib/cardStackGallery/hooks/utils/useMemoizeCards";
import { useRouter } from "next/navigation";

export default function CardStackScene({ images }: { images: StackImagesArray }) {
  const router = useRouter();

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
  // Reset mesh cache when cards change (scroll or hover)
  useEffect(() => {
    cardMeshes.current = [];
  }, [scrollPosition, hoveredIndex]);

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
  const cards = useMemoizeCards({
    scrollPosition,
    hoveredIndex,
    hoverTimeout,
    imageCount,
    images,
    renderDistance,
    spacing,
    camera,
  });

  // Optimized mouse move handler with cached meshes
  const handleMouseMove = useMouseHover(
    isDragging,
    raycaster,
    mouse,
    camera,
    scene,
    gl,
    setHoveredIndex,
    cardMeshes,
    hoverTimeout
  );

  // Throttled mouse move to prevent flickering on hover
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

  // Handle mouse wheel with momentum
  const handleWheel = useHandleWheel(velocity, setScrollPosition);

  // Handle touch or mouse start
  const handleTouchStart = useTouchStart(
    touchStartY,
    touchStartX,
    lastTouchY,
    isDragging,
    velocity,
    touchVelocity,
    lastTouchTime,
    gl
  );

  // Handle touch or mouse move with velocity tracking
  const handleTouchMove = useTouchMove(
    isDragging,
    lastTouchTime,
    lastTouchY,
    touchStartY,
    touchStartX,
    touchVelocity,
    velocity,
    setScrollPosition
  );

  // Handle touch or mouse end with momentum application
  const handleTouchEnd = useTouchEnd(isDragging, touchVelocity, velocity, gl);

  // Responsive camera adjustment
  useResponsiveCamera(camera, size);

  // Set up event listeners
  useInitEventListeners(handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, throttledMouseMove);

  // Push active card title to context
  useEffect(() => {
    const activeCard = findActiveCard(cards);
    if (activeCard) {
      console.log(
        "Active Card:\nTitle:",
        activeCard.cardTitle,
        "\nOwner Title:",
        activeCard.cardOwnerTitle,
        "\nOwner Slug:",
        activeCard.cardOwnerSlug
      );
      // setActiveCardTitle(activeCard.cardTitle);
      // setActiveCardOwner(activeCard.cardOwnerTitle);
      // setActiveCardOwnerSlug(activeCard.cardOwnerSlug);
    }
  }, [cards, scrollPosition]);

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
          thumbnailUrl={card.thumbnailUrl}
          snippetUrl={card.snippetUrl}
          cardTitle={card.cardTitle}
          onClick={() => {
            if (isDragging.current) {
              return;
            } else {
              if (card.cardIndex !== scrollPosition) {
                setScrollPosition(card.cardIndex);
              } else {
                router.push(`/index/${card.cardOwnerSlug}`);
              }
            }
          }}
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
