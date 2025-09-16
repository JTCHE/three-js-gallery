// Takes in the cards array
// Returns the currently active card's title and owner

import { CardProps } from "@/app/components/cardStackGallery/CardStackCanvas/CardStackScene/Card/Card";

export default function findActiveCard(cards: CardProps[]) {
  const activeCard = cards.find((card) => card.isActive);
  if (activeCard) {
    return { cardTitle: activeCard.cardTitle, cardOwner: activeCard.cardOwner };
  }
}
