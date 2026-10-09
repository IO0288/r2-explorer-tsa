import { R2Explorer } from "r2-explorer";
import { isShareRoute } from "./share-routes.mjs";

const explorer = R2Explorer({
	readonly: false,
	emailRouting: false,
	buckets: {
		bucket: {
			publicUrl: "https://tsa.cdn.z02.dev",
		},
	},

	// Learn more how to secure your R2 Explorer instance:
	// https://r2explorer.com/getting-started/security/
	// cfAccessTeamName: "my-team-name",
});

export default {
	...explorer,
	fetch(request: Request, env: unknown, context: ExecutionContext) {
		if (isShareRoute(request.url)) {
			return Response.json({ message: "Not found" }, { status: 404 });
		}
		return explorer.fetch(request, env, context);
	},
};
