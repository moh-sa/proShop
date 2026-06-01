import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import type { UpdateProfile } from "@/features/profile/types";
import type { User } from "@/features/users";
import { DemoAccountAlert, isDemoAccountEmail } from "@/shared/demo";
import { ErrorAlert } from "@/shared/errors";
import { useAppForm } from "@/shared/form";
import { PageHeader } from "@/shared/layout/page";
import { Link } from "@tanstack/react-router";
import { buildUpdateProfilePayload } from "../helpers/build-update-profile-payload.helper";
import { createUpdateProfileFormSchema } from "../schemas";

type ProfileEditFormProps = {
	user: User;
	isPending: boolean;
	onSubmit: (values: UpdateProfile) => void;
};

export function ProfileEditForm(props: ProfileEditFormProps) {
	const isDemoAccount = isDemoAccountEmail(props.user.email);

	const form = useAppForm({
		defaultValues: {
			name: props.user.name,
			email: props.user.email,
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: createUpdateProfileFormSchema(props.user),
		},
		onSubmit: ({ value }) => {
			const payload = buildUpdateProfilePayload(value, props.user);
			props.onSubmit(payload);
		},
	});

	return (
		<div className="space-y-8">
			<header>
				<PageHeader
					title="Edit Profile"
					description="Update your account details. Leave password blank to keep your current password."
				/>
				{isDemoAccount ? <DemoAccountAlert className="mb-4" /> : null}
			</header>

			<Frame>
				<FramePanel className="p-6">
					{/* FORM-LEVEL ERRORS */}
					<form.Subscribe selector={(state) => state.errors}>
						{(errors) => {
							const formErrors = [
								...new Set(
									errors
										.flatMap((errorObj) => errorObj?.[""] ?? [])
										.map((issue) => issue.message),
								),
							];

							return (
								formErrors.length > 0 && (
									<ErrorAlert
										title="Something went wrong"
										message={formErrors}
									/>
								)
							);
						}}
					</form.Subscribe>

					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<form.AppField name="name">
							{(field) => (
								<field.TextField
									label="Name"
									description="Leave unchanged to keep current name"
									type="text"
									autoComplete="username"
									placeholder="Enter your new name"
								/>
							)}
						</form.AppField>
						<form.AppField name="email">
							{(field) => (
								<field.TextField
									label="Email"
									description="Leave unchanged to keep current email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									disabled={isDemoAccount}
								/>
							)}
						</form.AppField>
						<form.AppField name="password">
							{(field) => (
								<field.TextField
									label="New Password"
									description="Leave blank to keep current password"
									type="password"
									autoComplete="new-password"
									placeholder="Enter your new password"
									disabled={isDemoAccount}
								/>
							)}
						</form.AppField>
						<form.AppField name="confirmPassword">
							{(field) => (
								<field.TextField
									label="Confirm Password"
									description="Leave blank to keep current password"
									type="password"
									autoComplete="new-password"
									placeholder="Confirm your new password"
									disabled={isDemoAccount}
								/>
							)}
						</form.AppField>

						<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
							<Button
								className="w-full sm:w-auto"
								nativeButton={false}
								render={<Link to="/profile" />}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<form.Subscribe
								selector={(state) => [
									state.canSubmit,
									state.isSubmitting,
									state.isDirty,
								]}
								children={([canSubmit, isSubmitting, isDirty]) => (
									<Button
										type="submit"
										className="w-full sm:w-auto"
										disabled={!canSubmit || props.isPending || !isDirty}
									>
										{isSubmitting || props.isPending ? (
											<>
												<Spinner />
												Saving…
											</>
										) : (
											"Save Changes"
										)}
									</Button>
								)}
							/>
						</div>
					</form>
				</FramePanel>
			</Frame>
		</div>
	);
}
