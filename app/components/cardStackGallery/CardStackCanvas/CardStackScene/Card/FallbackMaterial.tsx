import { useTexture } from "@react-three/drei";

export default function FallbackMaterial({ url }: { url: string }) {
  const texture = useTexture(url);
  return (
    <meshBasicMaterial
      map={texture}
      toneMapped={false}
    />
  );
}
