import { FormTextField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { signUpInputSchema, type SignUpInput } from "@/features/auth";
import { useForm } from "@tanstack/react-form";

type SignUpFormProps = {
	onSubmit: (values: SignUpInput) => void;
};

export function SignUpForm(props: SignUpFormProps) {
	const form = useForm({
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
				<form.Field
					name="name"
					validators={{
						onChange: signUpInputSchema.shape.name,
					}}
					children={(field) => (
						<FormTextField
							field={field}
							label="Username"
							type="text"
							autoComplete="username"
							placeholder="Enter your username"
							required
						/>
					)}
				/>
			</div>

			<div>
				<form.Field
					name="email"
					validators={{
						onChange: signUpInputSchema.shape.email,
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
						onChange: signUpInputSchema.shape.password,
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
						{isSubmitting ? "Signing up…" : "Sign Up"}
					</Button>
				)}
			/>
		</form>
	);
}
