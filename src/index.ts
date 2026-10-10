import { R2Explorer } from "r2-explorer";
import { isShareRoute } from "./share-routes.mjs";

function createExplorer(env: Env) {
	return R2Explorer({
		readonly: false,
		emailRouting: false,
		basicAuth: {
			username: env.R2_EXPLORER_USERNAME,
			password: env.R2_EXPLORER_PASSWORD,
		},
		buckets: {
			bucket: {
				publicUrl: "https://tsa.cdn.z02.dev",
			},
		},
	});
}

export default {
	fetch(request: Request, env: Env, context: ExecutionContext) {
		if (isShareRoute(request.url)) {
			return Response.json({ message: "Not found" }, { status: 404 });
		}
		return createExplorer(env).fetch(request, env, context);
	},
	email(event: { raw: unknown; rawSize: unknown }, env: Env, context: ExecutionContext) {
		return createExplorer(env).email(event, env as any, context);
	},
};
