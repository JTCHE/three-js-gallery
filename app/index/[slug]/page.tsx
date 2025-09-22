// take in slug param
export default async function projectPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return (
    <div>
      <h1>Project Page</h1>
      <p>Slug: {slug}</p>
    </div>
  );
}
