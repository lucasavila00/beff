import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Layout } from "@/components/layout";
import { getServerSession } from "next-auth";
export default async function Repo({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  //   const searchParams = useSearchParams();
  //   const params = useParams();
  //   const title = searchParams.get("title");
  return (
    <Layout session={session}>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </Layout>
  );
}
