import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
	// TODO: add `beforeLoad` to check if the user is *NOT* authenticated
	component: Outlet,
});
