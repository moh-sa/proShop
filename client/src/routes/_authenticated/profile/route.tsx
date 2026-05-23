import { ProfileLayout } from "@/features/profile/components/profile-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfileLayout,
});
