import { Button } from "@/components/ui/button";
import { updateUserMutationOptions } from "@/features/admin/queries";
import type { User } from "@/features/users/types";
import { nameSchema, emailSchema } from "@/features/users/schemas";
import { DemoAccountAlert, isDemoAccountEmail } from "@/shared/demo";
import { useAppForm } from "@/shared/form";
import { BackButton, PageHeader } from "@/shared/layout/page";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

type UserEditFormProps = {
	user: User;
	search: Record<string, unknown>;
};

export function UserEditForm(props: UserEditFormProps) {
	const navigate = useNavigate();
	const mutation = useMutation(updateUserMutationOptions);
	const isDemoAccount = isDemoAccountEmail(props.user.email);

	const form = useAppForm({
		defaultValues: {
			name: props.user.name,
			email: props.user.email,
			isAdmin: props.user.isAdmin,
		},
		onSubmit: async ({ value }) => {
			const payload = isDemoAccount
				? { name: value.name, userId: props.user.id }
				: { userId: props.user.id, ...value };

			await mutation.mutateAsync(payload, {
				onSuccess: () => navigate({ to: "/dashboard/users" }),
			});
		},
	});

	return (
		<div className="max-w-md">
			<BackButton
				label="Back to Users"
				to="/dashboard/users"
				search={props.search}
			/>
			<PageHeader title="Edit User" description="Edit user details" />

			{isDemoAccount ? <DemoAccountAlert className="mb-4" /> : null}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-5"
			>
				<form.AppField
					name="name"
					validators={{ onChange: nameSchema }}
				>
					{(field) => (
						<field.TextField
							label="Name"
							type="text"
							autoComplete="off"
							required
						/>
					)}
				</form.AppField>

				<form.AppField
					name="email"
					validators={{ onChange: emailSchema }}
				>
					{(field) => (
						<field.TextField
							label="Email"
							type="email"
							autoComplete="off"
							disabled={isDemoAccount}
							required
						/>
					)}
				</form.AppField>

				<form.AppField name="isAdmin">
					{(field) => (
						<div className="flex items-center gap-2">
							<input
								id="isAdmin"
								type="checkbox"
								checked={field.state.value}
								onChange={(e) => field.handleChange(e.target.checked)}
								disabled={isDemoAccount}
								className="size-4 rounded border-border"
							/>
							<label htmlFor="isAdmin" className="text-sm font-medium">
								Admin privileges
							</label>
						</div>
					)}
				</form.AppField>

				<Button type="submit" disabled={mutation.isPending}>
					{mutation.isPending ? "Saving..." : "Save Changes"}
				</Button>
			</form>
		</div>
	);
}
