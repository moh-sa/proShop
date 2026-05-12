import { Button } from "@/components/ui/button";
import { signInInputSchema, type SignInInput } from "@/features/auth";
import { useAppForm } from "@/shared/form";

type SignInFormProps = {
	onSubmit: (values: SignInInput) => void;
};

export function SignInForm(props: SignInFormProps) {
	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: (values) => {
			props.onSubmit(values.value);
		},
	});

	return (
		<form
			className="space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div>
				<form.AppField
					name="email"
					validators={{
						onChange: signInInputSchema.shape.email,
					}}
				>
					{(field) => (
						<field.TextField
							label="Email Address"
							type="email"
							autoComplete="email"
							placeholder="Enter your email address"
							required
						/>
					)}
				</form.AppField>
			</div>

			<div>
				<form.AppField
					name="password"
					validators={{
						onChange: signInInputSchema.shape.password,
					}}
				>
					{(field) => (
						<field.TextField
							label="Password"
							type="password"
							autoComplete="current-password"
							placeholder="Enter your password"
							required
						/>
					)}
				</form.AppField>
			</div>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				children={([canSubmit, isSubmitting]) => (
					<Button type="submit" className="w-full" disabled={!canSubmit}>
						{isSubmitting ? "Signing in…" : "Sign In"}
					</Button>
				)}
			/>
		</form>
	);
}
