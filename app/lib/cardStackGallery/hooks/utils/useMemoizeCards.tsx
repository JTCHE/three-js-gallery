import { CardProps } from "@/app/components/cardStackGallery/CardStackCanvas/CardStackScene/Card/Card";
import { useMemo } from "react";
import * as THREE from "three";
import { StackImagesArray } from "../../fetchStackImages";

export default function useMemoizeCards({
  scrollPosition,
  hoveredIndex,
  hoverTimeout,
  imageCount,
  images,
  renderDistance,
  spacing,
  camera,
}: {
  scrollPosition: number;
  hoveredIndex: number | null;
  hoverTimeout: React.RefObject<NodeJS.Timeout | null>;
  imageCount: number;
  images: StackImagesArray;
  renderDistance: number;
  spacing: number;
  camera: THREE.Camera;
}) {
  return useMemo(() => {
    const centerIndex = Math.round(scrollPosition);
    const cardData: Array<CardProps> = [];

    for (let i = centerIndex - renderDistance; i <= centerIndex + renderDistance; i++) {
      const imageIndex = ((i % imageCount) + imageCount) % imageCount;
      cardData.push({
        cardIndex: i,
        thumbnailUrl: images[imageIndex].thumbnailSrc,
        snippetUrl: images[imageIndex].snippetSrc,
        cardTitle: images[imageIndex].title,
        zPosition: i * spacing,
        isActive: hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
        cardOwnerTitle: images[imageIndex].ownerTitle,
        cardOwnerSlug: images[imageIndex].ownerSlug,
        onClick: () => void 0, // Placeholder, will be set in CardStackScene
      });
    }
    return cardData;
  }, [Math.round(scrollPosition), hoveredIndex, hoverTimeout, imageCount, images, renderDistance, spacing, camera]);
}
