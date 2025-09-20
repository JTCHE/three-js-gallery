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

  return (
    <div
      className="w-screen h-screen overflow-hidden touch-none flex justify-center items-center"
    >
      {!errorMessage ? ( // <Suspense fallback={<span className="text-neutral-500">Loading gallery...</span>}>
        <CardStackCanvas images={imageArray} />
      ) : (
        // </Suspense>
        <LoadFailed error={errorMessage} />
      )}
    </div>
  );
}

function LoadFailed({ error }: { error: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-neutral-500">oops, something happened whilst loading the gallery.</p>
      <p className="text-neutral-500 lowercase">
        <span>{error}</span>
      </p>
    </div>
  );
}
