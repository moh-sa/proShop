import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { updateProfileMutationOptions } from "@/features/profile/queries";
import type { UpdateProfile } from "@/features/profile/types";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile/edit")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const mutation = useMutation(updateProfileMutationOptions);
	const { user } = Route.useRouteContext();

	function onSubmit(values: UpdateProfile) {
		mutation.mutate(values, {
			onSuccess: () => {
				toast.success("Profile updated successfully");
				navigate({ to: "/profile" });
			},
			onError: (error) => {
				toast.error("Failed to update profile", {
					description: error.message,
				});
			},
		});
	}

	return (
		<ProfileEditForm
			user={user}
			isPending={mutation.isPending}
			onSubmit={onSubmit}
		/>
	);
}
