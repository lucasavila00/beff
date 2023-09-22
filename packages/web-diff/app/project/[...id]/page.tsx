export default async function Repo({ params }: { params: { id: string } }) {
  //   const searchParams = useSearchParams();
  //   const params = useParams();
  //   const title = searchParams.get("title");
  return (
    <>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </>
  );
}
