import { NotFoundPage } from "@/components/errors";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/not-found")({
	component: RouteComponent,
});

function RouteComponent() {
	return <NotFoundPage />;
}
