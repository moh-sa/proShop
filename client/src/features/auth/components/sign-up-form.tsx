import { Button } from "@/components/ui/button";
import { signUpInputSchema, type SignUpInput } from "@/features/auth";
import { useAppForm } from "@/shared/form";

type SignUpFormProps = {
	onSubmit: (values: SignUpInput) => void;
};

export function SignUpForm(props: SignUpFormProps) {
	const form = useAppForm({
		defaultValues: {
			name: "",
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
					name="name"
					validators={{
						onChange: signUpInputSchema.shape.name,
					}}
				>
					{(field) => (
						<field.TextField
							label="Username"
							type="text"
							autoComplete="username"
							placeholder="Enter your username"
							required
						/>
					)}
				</form.AppField>
			</div>

			<div>
				<form.AppField
					name="email"
					validators={{
						onChange: signUpInputSchema.shape.email,
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
						onChange: signUpInputSchema.shape.password,
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
						{isSubmitting ? "Signing up…" : "Sign Up"}
					</Button>
				)}
			/>
		</form>
	);
}
