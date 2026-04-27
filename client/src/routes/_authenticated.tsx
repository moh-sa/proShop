import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  // TODO: add `beforeLoad` to check if the user is authenticated
  component: Outlet,
});
