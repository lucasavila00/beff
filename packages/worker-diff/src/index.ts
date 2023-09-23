import { Client } from 'pg';

export interface Env {
	// This should be a valid Postgres connection string
	// For example, "postgres://reader:NWDMCE5xdipIjRrp@hh-pgsql-public.ebi.ac.uk:5432/pfmegrnargs"
	// Use `wrangler secret put DB_URL` to configure a Secret with your connection string
	DB_URL: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === '/favicon.ico') return new Response(null, { status: 404 });

		var client = new Client(env.DB_URL);
		await client.connect();

		// Query the RNA database!
		const result = await client.query({
			text: 'SELECT * FROM "Project" LIMIT 10',
		});
		console.log(JSON.stringify(result.rows));
		const resp = Response.json(result.rows);

		// Clean up the client, ensuring we don't kill the worker before that is
		// completed.
		ctx.waitUntil(client.end());
		return resp;
	},
};
