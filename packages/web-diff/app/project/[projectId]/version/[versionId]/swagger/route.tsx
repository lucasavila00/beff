import { swaggerTemplate } from "@beff/hono";
export async function GET(
  request: Request,
  { params }: { params: { projectId: string; versionId: string } }
) {
  const baseUrl = new URL(request.url).origin;
  const jsonUrl = `${baseUrl}/project/${params.projectId}/version/${params.versionId}/json`;
  const html = swaggerTemplate(jsonUrl);
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
}
