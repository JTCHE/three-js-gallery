export type StackImagesArray = {
  thumbnailSrc: string;
  placeholderSrc: string;
  imageWidth: number;
  imageHeight: number;
  snippetSrc: string | null;
  title: string;
  ownerTitle: string;
  ownerSlug: string;
}[];

// Initialize the array cache for the results
let cachedImages: StackImagesArray | null = null;

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Define the expected structure of the gallery image item from the API
interface GalleryOwnership {
  title?: string;
  slug?: string;
}

interface GalleryMediaFormats {
  thumbnail?: { url?: string };
  medium?: { url?: string };
}

interface GalleryMedia {
  url?: string;
  width?: number;
  height?: number;
  formats?: GalleryMediaFormats;
}

interface GalleryItem {
  Media?: GalleryMedia;
  snippet?: { url?: string };
  OwnershipType?: string;
  project_ownership?: GalleryOwnership;
  article_ownership?: GalleryOwnership;
  title?: string;
}

// fetchStackImages function that pulls from strapi api (STRAPI_BASE_URL and STRAPI_API_KEY env vars must be set) from the gallery-images collection type. fetch all images and console log and return the array
export default async function fetchStackImages(): Promise<StackImagesArray> {
  // Return a shuffled copy of the cached images if it exists
  if (cachedImages) {
    return shuffleArray(cachedImages);
  }

  const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;
  const STRAPI_API_KEY = process.env.STRAPI_API_KEY;

  if (!STRAPI_BASE_URL || !STRAPI_API_KEY) {
    throw new Error("Missing Strapi API credentials");
  }

  const res = await fetch(`${STRAPI_BASE_URL}/api/gallery-images?populate=*`, {
    headers: {
      Authorization: `Bearer ${STRAPI_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error fetching images from Strapi: ${res.statusText}`);
  }

  const data = await res.json();

  cachedImages = Array.isArray(data.data)
    ? data.data
        .map((item: GalleryItem) => {
          const placeholderSrc = item.Media?.formats?.thumbnail?.url ?? "";
          const imageWidth = item.Media?.width ?? 1;
          const imageHeight = item.Media?.height ?? 1;
          const thumbnailSrc = item.Media?.formats?.medium?.url ?? item.Media?.url ?? "";
          const snippetSrc = item.snippet?.url ?? null;
          const ownership =
            item.OwnershipType === "project"
              ? item.project_ownership
              : item.OwnershipType === "article"
              ? item.article_ownership
              : {};
          const ownerTitle = ownership?.title ?? "";
          const ownerSlug = ownership?.slug ?? "";
          const title = item.title;
          if (!thumbnailSrc || !ownerTitle || !title || !ownerSlug) {
            return null;
          }
          return {
            thumbnailSrc,
            title,
            ownerTitle,
            ownerSlug,
            snippetSrc,
            placeholderSrc,
            imageWidth,
            imageHeight,
          };
        })
        .filter((img: unknown) => img !== null)
    : [];

  return shuffleArray(cachedImages ?? []);
}
