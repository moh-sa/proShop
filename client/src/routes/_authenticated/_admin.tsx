import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin")({
  // TODO: add `beforeLoad` to check if has the admin permissions
  component: Outlet,
});
