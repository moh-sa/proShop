import { getRouter } from "@/shared/router";
import { mutationOptions } from "@tanstack/react-query";
import { demoSignInApi, signInApi, signOutApi, signUpApi } from "../api/api";
import { authKeys } from "./keys";

export const signUpMutationOptions = mutationOptions({
	mutationKey: ["sign-up"],
	mutationFn: signUpApi,
	onSuccess: async (data, _variables, _onMutateResult, context) => {
		context.client.setQueryData(authKeys.me(), data);
		await getRouter().invalidate();
	},
});

export const signInMutationOptions = mutationOptions({
	mutationKey: ["sign-in"],
	mutationFn: signInApi,
	onSuccess: async (data, _variables, _onMutateResult, context) => {
		context.client.setQueryData(authKeys.me(), data);
		await getRouter().invalidate();
	},
});

export const demoSignInMutationOptions = mutationOptions({
	mutationKey: ["demo-sign-in"],
	mutationFn: demoSignInApi,
	onSuccess: async (data, _variables, _onMutateResult, context) => {
		context.client.setQueryData(authKeys.me(), data);
		await getRouter().invalidate();
	},
});

export const signOutMutationOptions = mutationOptions({
	mutationKey: ["sign-out"],
	mutationFn: signOutApi,
	onSuccess: async (_data, _variables, _onMutateResult, context) => {
		context.client.setQueryData(authKeys.me(), null);
		await getRouter().invalidate();
	},
});
