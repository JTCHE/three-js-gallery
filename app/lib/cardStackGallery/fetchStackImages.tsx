import fs from "fs";
import path from "path";

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

// Helper to get mime type from extension
function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeMap[ext.toLowerCase()] || "application/octet-stream";
}

// Optimized function with caching
// export default function fetchStackImages(): StackImagesArray {
//   if (cachedImages) return shuffleArray(cachedImages);

//   const dir = path.resolve("./app/public/img/index");
//   const exts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

//   try {
//     const images = fs.readdirSync(dir)
//       .filter(file => exts.includes(path.extname(file).toLowerCase()))
//       .map(file => {
//         const ext = path.extname(file).toLowerCase();
//         const mimeType = getMimeType(ext);
//         const base64 = fs.readFileSync(path.join(dir, file)).toString("base64");
//         return {
//           src: `data:${mimeType};base64,${base64}`,
//           title: path.parse(file).name,
//         };
//       });

//     if (!images.length) throw new Error("No images found in the directory.");
//     cachedImages = images;
//     return shuffleArray(images);
//   } catch (error) {
//     console.error("Error loading images:", error);
//     return [];
//   }
// }

// export default function fetchStackImages(): StackImagesArray {

//   return [
//     {
//       src: "https://images.unsplash.com/photo-1757377125320-cf0d54c0c6e8",
//       title: "cityscape",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
//       title: "mountains",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1494526585095-c41746248156",
//       title: "forest",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1534081333815-ae5019106622",
//       title: "desert",
//     },
//     {
//       src: "https://plus.unsplash.com/premium_photo-1757260019137-0d1e8389c9d3",
//       title: "field",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1751517298153-9987060ba831",
//       title: "waves",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1500534623283-312aade485b7",
//       title: "beach",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1468071174046-657d9d351a40",
//       title: "canyon",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
//       title: "lake",
//     },
//     {
//       src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
//       title: "river",
//     },
//   ];
// }

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
