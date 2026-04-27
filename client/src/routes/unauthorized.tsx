import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  component: RouteComponent,
});

// TODO: replace with a proper unauthorized page
function RouteComponent() {
  return <div>Hello "/unauthorized"!</div>;
}
