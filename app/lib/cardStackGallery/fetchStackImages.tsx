export type StackImagesArray = { src: string; title: string }[];

// Cache the results
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

// fetchStackImages function that pulls from strapi api (STRAPI_BASE_URL and STRAPI_API_KEY env vars must be set) from the gallery-images collection type. fetch all images and console log and return the array
export default async function fetchStackImages(): Promise<StackImagesArray> {
  if (cachedImages) return shuffleArray(cachedImages);

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
    console.error("Error fetching images from Strapi:", res.statusText);
    return [];
  }

  const data = await res.json();

  cachedImages = Array.isArray(data.data)
    ? data.data.map((item: any) => ({
        src: item.Media?.url ?? "",
        title: item.title,
      }))
    : [];

  return shuffleArray(cachedImages ?? []);
}
