import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	SignUpForm,
	signUpMutationOptions,
	type SignUpInput,
} from "@/features/auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest/signup")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const mutation = useMutation(signUpMutationOptions);

	let serverError: string | undefined;

	if (mutation.isError) {
		const error = mutation.error.details;

		if (error.kind === "NETWORK") {
			serverError = "Please check your internet connection and try again.";
		}

		if (error.kind === "SERVER") {
			serverError =
				error.details[0]?.message ?? "An unexpected error occurred.";
		}
	}

	const errors = {
		server: serverError,
	};

	function handleSubmit(values: SignUpInput) {
		mutation.mutate(values, {
			onSuccess: () => {
				navigate({ to: "/", replace: true });
			},
		});
	}

	return (
		<Card className="border-none shadow-md">
			<CardHeader className="px-8">
				<CardTitle className="mb-1.5 text-2xl">
					Sign up for ProShop
					<CardDescription className="mt-1.5 text-sm text-muted-foreground">
						Create an account to get started
					</CardDescription>
				</CardTitle>
			</CardHeader>

			<CardContent className="px-8">
				{/* Signup Form */}
				<div className="space-y-4">
					{errors.server && (
						<p className="text-sm text-wrap text-destructive">
							{errors.server}
						</p>
					)}
					<SignUpForm onSubmit={handleSubmit} />
				</div>
			</CardContent>

			<CardFooter className="justify-center">
				<p className="text-muted-foreground">
					Already have an account?{" "}
					<Link to="/signin" className="text-card-foreground hover:underline">
						Sign in
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
