import { AdminLayout } from "@/features/admin/components";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/dashboard")({
	component: AdminLayout,
});
