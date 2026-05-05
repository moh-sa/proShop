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

	function handleSubmit(values: SignInInput) {
		mutation.mutate(values, {
			onSuccess: () => {
				navigate({ to: redirectTo, replace: true });
			},
		});
	}

	function handleCustomerSignin() {
		// TODO: implement customer signin
		console.log("Customer login");
	}

	function handleAdminSignin() {
		// TODO: implement admin signin
		console.log("Admin login");
	}

	return (
		<div className="flex h-full items-center justify-center">
			<Card className="max-w-96 border-none shadow-md">
				<CardHeader className="px-8">
					<CardTitle className="mb-1.5 text-2xl">Sign in to ProShop</CardTitle>
				</CardHeader>

				<CardContent className="px-8">
					{/* Quick Login Buttons */}
					<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
						<Button variant="outline" onClick={handleCustomerSignin}>
							Login as Customer
						</Button>
						<Button variant="outline" onClick={handleAdminSignin}>
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
						<SignInForm onSubmit={handleSubmit} />
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
		</div>
	);
}
