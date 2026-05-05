import { FormTextField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { signInInputSchema, type SignInInput } from "@/features/auth";
import { useForm } from "@tanstack/react-form";

type SignInFormProps = {
	onSubmit: (values: SignInInput) => void;
};

export function SignInForm(props: SignInFormProps) {
	const form = useForm({
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
				<form.Field
					name="email"
					validators={{
						onChange: signInInputSchema.shape.email,
					}}
					children={(field) => (
						<FormTextField
							field={field}
							label="Email Address"
							type="email"
							autoComplete="email"
							placeholder="Enter your email address"
							required
						/>
					)}
				/>
			</div>

			<div>
				<form.Field
					name="password"
					validators={{
						onChange: signInInputSchema.shape.password,
					}}
					children={(field) => (
						<FormTextField
							field={field}
							label="Password"
							type="password"
							autoComplete="current-password"
							placeholder="Enter your password"
							required
						/>
					)}
				/>
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
