// take in slug param
export default function projectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  return (
    <div>
      <h1>Project Page</h1>
      <p>Slug: {slug}</p>
    </div>
  );
}
