import { authKeys } from "@/features/auth";
import type { User } from "@/features/users";
import { mutationOptions } from "@tanstack/react-query";
import { updateProfileApi } from "../api";

export const updateProfileMutationOptions = mutationOptions({
	mutationFn: updateProfileApi,
	async onMutate(vars, ctx) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...safeVars } = vars;
		const authUser = ctx.client.getQueryData<User>(authKeys.me());
		if (!authUser) return;

		const now = new Date();

		const optimisticProfile: User = {
			...authUser,
			...safeVars,
			updatedAt: now,
		};

		// cancel any queries related to the user
		await ctx.client.cancelQueries({
			queryKey: authKeys.me(),
		});

		// snapshot the previous data
		const previousProfile = authUser;

		// update the cache with the optimistic data
		ctx.client.setQueryData<User>(authKeys.me(), optimisticProfile);

		// return the snapshot so onError can rollback if mutation fails
		return { previousProfile };
	},

	onError(_err, _vars, rollback, ctx) {
		// rollback the cache to the previous state
		if (rollback?.previousProfile !== undefined) {
			ctx.client.setQueryData<User>(authKeys.me(), rollback.previousProfile);
		}
	},

	onSuccess(updatedProfile, _vars, _rollback, ctx) {
		// update the cache with the real data returned from the server
		ctx.client.setQueryData<User>(authKeys.me(), updatedProfile);
	},
	onSettled(_data, _error, _vars, _mutationResult, ctx) {
		ctx.client.invalidateQueries({ queryKey: authKeys.me() });
	},
});
