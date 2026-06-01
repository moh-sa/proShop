import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SeparatorText } from "@/components/ui/separator-text";
import {
	demoSignInMutationOptions,
	SignInForm,
	signInMutationOptions,
	type SignInInput,
} from "@/features/auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_guest/signin")({
	validateSearch: z.object({
		redirect: z.string().startsWith("/").optional(),
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const redirectTo = redirect ?? "/";

	const mutation = useMutation(signInMutationOptions);
	const demoMutation = useMutation(demoSignInMutationOptions);
	const isSigningIn = mutation.isPending || demoMutation.isPending;

	let serverError: string | undefined;
	const error = mutation.error ?? demoMutation.error;

	if (error) {
		const details = error.details;

		if (details.kind === "NETWORK") {
			serverError = "Please check your internet connection and try again.";
		}

		if (details.kind === "SERVER") {
			serverError =
				details.details[0]?.message ?? "An unexpected error occurred.";
		}
	}

	const errors = {
		server: serverError,
	};

	function handleAuthSuccess() {
		navigate({ to: redirectTo, replace: true });
	}

	function handleSubmit(values: SignInInput) {
		mutation.mutate(values, {
			onSuccess: handleAuthSuccess,
		});
	}

	function handleCustomerSignin() {
		demoMutation.mutate({ role: "customer" }, { onSuccess: handleAuthSuccess });
	}

	function handleAdminSignin() {
		demoMutation.mutate({ role: "admin" }, { onSuccess: handleAuthSuccess });
	}

	return (
		<Card className="border-none shadow-md">
			<CardHeader className="px-8">
				<CardTitle className="mb-1.5 text-2xl">Sign in to ProShop</CardTitle>
			</CardHeader>

			<CardContent className="px-8">
				{/* Quick Login Buttons */}
				<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
					<Button
						variant="outline"
						onClick={handleCustomerSignin}
						disabled={isSigningIn}
					>
						Login as Customer
					</Button>
					<Button
						variant="outline"
						onClick={handleAdminSignin}
						disabled={isSigningIn}
					>
						Login as Admin
					</Button>
				</div>

				<SeparatorText text="OR" className="my-3" />

				{/* Login Form */}
				<div className="space-y-4">
					{errors.server && (
						<p className="text-sm text-wrap text-destructive">
							{errors.server}
						</p>
					)}
					<SignInForm onSubmit={handleSubmit} disabled={isSigningIn} />
				</div>
			</CardContent>

			<CardFooter className="justify-center">
				<p className="text-muted-foreground">
					New to ProShop?{" "}
					<Link to="/signup" className="text-card-foreground hover:underline">
						Sign up
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
