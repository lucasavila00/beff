import { redocTemplate } from "@beff/hono";
export async function GET(
  _request: Request,
  { params }: { params: { projectId: string; versionId: string } }
) {
  const jsonUrl = `/project/${params.projectId}/version/${params.versionId}/json`;
  const html = redocTemplate(jsonUrl);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
}
