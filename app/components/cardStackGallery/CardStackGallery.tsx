import images, { StackImagesArray } from "../../lib/cardStackGallery/fetchStackImages";
import CardStackCanvas from "./CardStackCanvas/CardStackCanvas";

// Main Component Export
export default async function CardStackGallery() {
  let imageArray: StackImagesArray = [];
  let errorMessage = null;
  try {
    imageArray = await images();
  } catch (error) {
    console.error("Failed to load images:", error);
    imageArray = [];
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  // if (!imageArray || imageArray.length === 0) return null;

  return (
    <div
      className="w-full h-screen overflow-hidden touch-none"
      style={{
        background:
          "linear-gradient(167deg, rgba(18, 18, 18, 0.00) 50%, rgba(18, 18, 18, 0.05) 92.09%), linear-gradient(165deg, rgba(252, 252, 252, 0.30) 9.01%, rgba(252, 252, 252, 0.05) 90.99%), rgba(252, 252, 252, 1)",
        backgroundBlendMode: "plus-darker, normal, normal",
      }}
    >
      {!errorMessage ? <CardStackCanvas images={imageArray} /> : <LoadFailed error={errorMessage} />}
    </div>
  );
}

function LoadFailed({ error }) {
  return <p>load failed: {error}</p>;
}
