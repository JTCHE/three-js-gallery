import images, { StackImagesArray } from "../../lib/cardStackGallery/fetchStackImages";
import CardStackCanvas from "./CardStackCanvas/CardStackCanvas";

// Main Component Export
export default async function CardStack() {
  let imageArray: StackImagesArray = [];
  try {
    imageArray = await images();
  } catch (error) {
    console.error("Failed to load images:", error);
    imageArray = [];
  }

  if (!imageArray || imageArray.length === 0) return null;

  return (
    <div className="w-full h-screen overflow-hidden touch-none">
      <CardStackCanvas images={imageArray} />
    </div>
  );
}
