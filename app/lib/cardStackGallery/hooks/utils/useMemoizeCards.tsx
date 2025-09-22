import { CardProps } from "@/app/components/cardStackGallery/CardStackCanvas/CardStackScene/Card/Card";
import { useMemo } from "react";
import { StackImagesArray } from "../../fetchStackImages";

export default function useMemoizeCards({
  scrollPosition,
  hoveredIndex,
  images,
  spacing,
  isAnimating,
}: {
  scrollPosition: number;
  hoveredIndex: number | null;
  images: StackImagesArray;
  spacing: number;
  isAnimating: boolean;
}) {
  const imageCount = images.length;
  // How many cards to render on either side of center index (12 each side = 25 total)
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

      cardData.push({
        cardIndex: i,
        imageWidth: images[imageIndex].imageWidth,
        imageHeight: images[imageIndex].imageHeight,
        placeholderUrl: images[imageIndex].placeholderSrc,
        thumbnailUrl: images[imageIndex].thumbnailSrc,
        snippetUrl: images[imageIndex].snippetSrc,
        cardTitle: images[imageIndex].title,
        zPosition: i * spacing,
        isActive: isAnimating ? false : hoveredIndex !== null ? i === hoveredIndex : i === centerIndex,
        cardOwnerTitle: images[imageIndex].ownerTitle,
        cardOwnerSlug: images[imageIndex].ownerSlug,
        shouldLoadFull: shouldLoadFullImage,
        isVisible: true,
      });
    }
    return cardData;
  }, [hoveredIndex, imageCount, images, spacing, centerIndex, isAnimating]);
}
