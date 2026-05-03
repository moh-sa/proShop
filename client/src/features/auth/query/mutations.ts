import { mutationOptions } from "@tanstack/react-query";
import { signInApi, signOutApi, signUpApi } from "../api/api";
import { authKeys } from "./keys";

export const signUpMutationOptions = mutationOptions({
	mutationKey: ["sign-up"],
	mutationFn: signUpApi,
	onSuccess(data, _variables, _onMutateResult, context) {
		context.client.setQueryData(authKeys.me(), data);
	},
});

export const signInMutationOptions = mutationOptions({
	mutationKey: ["sign-in"],
	mutationFn: signInApi,
	onSuccess(data, _variables, _onMutateResult, context) {
		context.client.setQueryData(authKeys.me(), data);
	},
});

export const signOutMutationOptions = mutationOptions({
	mutationKey: ["sign-out"],
	mutationFn: signOutApi,
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.setQueryData(authKeys.me(), null);
	},
});
