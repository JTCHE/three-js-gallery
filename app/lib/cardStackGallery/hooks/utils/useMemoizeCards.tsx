import { CardProps } from "@/app/components/cardStackGallery/CardStackCanvas/CardStackScene/Card/Card";
import { useMemo } from "react";
import { StackImagesArray } from "../../fetchStackImages";

export default function useMemoizeCards({
  scrollPosition,
  hoveredIndex,
  imageCount,
  images,
  spacing,
}: {
  scrollPosition: number;
  hoveredIndex: number | null;
  imageCount: number;
  images: StackImagesArray;
  spacing: number;
}) {
  const renderDistance = 12;
  const centerIndex = Math.round(scrollPosition);

  return useMemo(() => {
    const cardData: Array<CardProps> = [];

    for (let i = centerIndex - renderDistance; i <= centerIndex + renderDistance; i++) {
      const imageIndex = ((i % imageCount) + imageCount) % imageCount;

      // Determine current card distance from center index
      const distanceFromCenter = Math.abs(i - centerIndex);

      // Determine what to load based on distance
      const immediateLoadDistance = 3; // Load full images within 3 cards, starting from center, backwards and forwards (7 total)
      const shouldLoadFullImage = distanceFromCenter <= immediateLoadDistance;
      const isInRenderDistance = distanceFromCenter <= renderDistance;

      cardData.push({
        cardIndex: i,
        imageWidth: images[imageIndex].imageWidth,
        imageHeight: images[imageIndex].imageHeight,
        placeholderUrl: images[imageIndex].placeholderSrc,
        thumbnailUrl: images[imageIndex].thumbnailSrc,
        snippetUrl: images[imageIndex].snippetSrc,
        cardTitle: images[imageIndex].title,
        zPosition: i * spacing,
        isActive: hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
        cardOwnerTitle: images[imageIndex].ownerTitle,
        cardOwnerSlug: images[imageIndex].ownerSlug,
        shouldLoadFull: shouldLoadFullImage,
        isInRenderDistance,
        onClick: () => void 0, // Placeholder, will be set in CardStackScene
      });
    }
    return cardData;
  }, [scrollPosition, hoveredIndex, imageCount, images, spacing]);
}
