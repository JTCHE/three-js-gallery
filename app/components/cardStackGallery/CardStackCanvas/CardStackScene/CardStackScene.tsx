"use client";
import { StackImagesArray } from "@/app/lib/cardStackGallery/fetchStackImages";
import findActiveCard from "@/app/lib/cardStackGallery/findActiveCard";
import useResponsiveCamera from "@/app/lib/cardStackGallery/hooks/camera/useResponsiveCamera";
import useMouseHover from "@/app/lib/cardStackGallery/hooks/gestures/hover/useMouseHover";
import useHandleWheel from "@/app/lib/cardStackGallery/hooks/gestures/scroll/useHandleWheel";
import useTouchEnd from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchEnd";
import useTouchMove from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchMove";
import useTouchStart from "@/app/lib/cardStackGallery/hooks/gestures/touch/useTouchStart";
import useInitEventListeners from "@/app/lib/cardStackGallery/hooks/gestures/useInitEventListeners";
import useMemoizeCards from "@/app/lib/cardStackGallery/hooks/utils/useMemoizeCards";
import { OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Card from "./Card/Card";
import useClick from "@/app/lib/cardStackGallery/hooks/click/useClick";

export default function CardStackScene({ images }: { images: StackImagesArray }) {
  const router = useRouter();

  const spacing = 2.5;

  const [scrollPosition, setScrollPosition] = useState(0);
  const [stackOffset, setStackOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [animatingCardIndex, setAnimatingCardIndex] = useState<number | null>(null);
  const [lookAtValue, setLookAtValue] = useState(new THREE.Vector3(0, 0.5, 0));

  // Camera animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([6, 7, 13]);
  const [targetCameraPosition, setTargetCameraPosition] = useState<[number, number, number]>([6, 7, 13]);

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
    images,
    spacing,
    isAnimating,
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
  const handleClick = useClick(isDragging, raycaster, mouse, camera, scene, gl, cardMeshes, cards, handleAnimationStart);

  // Throttled mouse move to prevent flickering on hover
  const mouseMoveTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const throttledMouseMove = useCallback(
    (event: MouseEvent) => {
      if (mouseMoveTimeoutId.current) return;
      mouseMoveTimeoutId.current = setTimeout(() => {
        handleMouseMove(event);
        mouseMoveTimeoutId.current = null;
      }, 16); // ~60fps
    },
    [handleMouseMove]
  );

  // Main animation loop
  useFrame((_, delta) => {
    const targetOffset = -scrollPosition * spacing;
    setStackOffset((current) => THREE.MathUtils.lerp(current, targetOffset, 0.1));

    // Camera position animation
    if (isAnimating) {
      // interpolate camera position
      const currentPosition = new THREE.Vector3(...cameraPosition);
      const targetPosition = new THREE.Vector3(...targetCameraPosition);
      currentPosition.lerp(targetPosition, 0.07);
      setCameraPosition([currentPosition.x, currentPosition.y, currentPosition.z]);

      // interpolate lookAt position
      const currentLookAt = new THREE.Vector3(...lookAtValue);
      const targetLookAt = new THREE.Vector3(0, 0, 0);
      currentLookAt.lerp(targetLookAt, 0.07);
      setLookAtValue(currentLookAt);

      // Stop animation when close enough
      if (currentPosition.distanceTo(targetPosition) < 0.003) {
        setCameraPosition(targetCameraPosition);
        // Navigate to pending slug if exists
        if (pendingSlug) {
          router.push(`/index/${pendingSlug}`);
          setPendingSlug(null);
        } else {
          setCameraPosition(targetCameraPosition);
        }
      }
    }

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
    setScrollPosition,
    gl
  );

  // Handle touch or mouse end with momentum application
  const handleTouchEnd = useTouchEnd(isDragging, touchVelocity, velocity, gl);

  // Set up event listeners
  useInitEventListeners(
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    throttledMouseMove,
    handleClick,
    isAnimating
  );

  // Push active card title to context
  useEffect(() => {
    const activeCard = findActiveCard(cards);
    if (activeCard) {
      // console.log(
      //   "Active Card:\nTitle:",
      //   activeCard.cardTitle,
      //   "\nOwner Title:",
      //   activeCard.cardOwnerTitle,
      //   "\nOwner Slug:",
      //   activeCard.cardOwnerSlug
      // );
      // setActiveCardTitle(activeCard.cardTitle);
      // setActiveCardOwner(activeCard.cardOwnerTitle);
      // setActiveCardOwnerSlug(activeCard.cardOwnerSlug);
    }
  }, [cards, scrollPosition]);

  function handleAnimationStart(slug: string, cardIndex: number) {
    setPendingSlug(slug);
    toggleCameraPosition(cardIndex);
  }

  function toggleCameraPosition(cardIndex: number) {
    // Ensure scrollPosition matches cardIndex before animating
    setTimeout(() => {
      setScrollPosition((current) => {
        if (current !== cardIndex) {
          return cardIndex;
        }
        return current;
      });
    }, 100);

    const basePosition = cameraPosition[2] !== 13;
    setTargetCameraPosition(basePosition ? [6, 7, 13] : [0, 0, 10]);
    setAnimatingCardIndex(basePosition ? null : cardIndex);
    setIsAnimating(true);
  }

  // Responsive camera adjustment
  useResponsiveCamera(camera, size, cameraPosition, isAnimating, lookAtValue);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={cameraPosition}
        near={0.001}
      />

      {cards.map((card) => (
        <Card
          key={card.cardIndex}
          zPosition={card.zPosition + stackOffset}
          cardIndex={card.cardIndex}
          isActive={card.isActive}
          imageWidth={card.imageWidth}
          imageHeight={card.imageHeight}
          placeholderUrl={card.placeholderUrl}
          thumbnailUrl={card.thumbnailUrl}
          snippetUrl={card.snippetUrl}
          cardTitle={card.cardTitle}
          cardOwnerSlug={card.cardOwnerSlug}
          shouldLoadFull={card.shouldLoadFull}
          isVisible={!isAnimating || animatingCardIndex === card.cardIndex}
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
