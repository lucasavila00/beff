import { Ctx as BeffCtx } from "@beff/hono";
import { Client } from "pg";

type Ctx = BeffCtx<
	{},
	{
		Variables: {
			DB_URL: string;
		};
	}
>;

type UploadVersionBody = {
	version: string;
	branch: string;
	commitHash: string;
	schema: string;
	projectId: string;
};
type UploadedVersionOkResponse = {
	ok: true;
	versionId: string;
};
type UploadedVersionResponse = UploadedVersionOkResponse;
const Router = {
	"/": {
		get: async (c: Ctx): Promise<string> => {
			return "ok";
		},
	},
	"/upload_version": {
		post: async (c: Ctx, data: UploadVersionBody): Promise<UploadedVersionResponse> => {
			const client = new Client(c.hono.var.DB_URL);
			await client.connect();

			const newRow = await client.query({
				text: 'INSERT INTO "Version" ("version", "branch", "commitHash", "schema", "projectId") VALUES ($1, $2, $3, $4, $5) RETURNING "id"',
				values: [data.version, data.branch, data.commitHash, data.schema, data.projectId],
			});
			const versionId = newRow.rows[0].id;
			// Clean up the client, ensuring we don't kill the worker before that is
			// completed.
			c.hono.executionCtx.waitUntil(client.end());

			return {
				ok: true,
				versionId: versionId,
			};
		},
	},
};
export default Router;
