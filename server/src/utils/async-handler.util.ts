import type {
	AsyncHandlerGenerics,
	StrictAsyncHandler,
} from "../types/async-handler.type.js";

/**
 * Wraps async Express handlers to ensure proper error handling
 * Automatically catches any thrown errors and passes them to Express error middleware
 *
 * @param fn - The async handler function to wrap
 * @returns A wrapped handler with automatic error catching
 * @example
 * ```ts
 * strictAsyncHandler<{
 * 	params: { id: string };
 * 	query: { page: string };
 * 	reqBody: { name: string };
 * 	resBody: { data: { user: SafeUser }; meta: { timestamp: string } };
 * }>(async (req, res, _next) => {
 * 	req.body.name;
 * 	req.query.page;
 * 	req.params.id;
 *
 * 	res.json({
 * 		data: { user: SafeUser },
 * 		meta: { timestamp: Date().toISOString() },
 * 		success: true,
 * 	});
 * });
 */
export function strictAsyncHandler<G extends AsyncHandlerGenerics>(
	fn: StrictAsyncHandler<G>,
): StrictAsyncHandler<G> {
	return async function asyncHandlerWrapper(req, res, next) {
		try {
			await fn(req, res, next);
		} catch (error) {
			// Ensure error is an Error object for consistent handling
			const processedError =
				error instanceof Error ? error : new Error(String(error));

			next(processedError);
		}
	};
}
