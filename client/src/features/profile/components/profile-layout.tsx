import { Outlet } from "@tanstack/react-router";
import { ProfileNav } from "./profile-nav";

export function ProfileLayout() {
	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,13rem)_1fr] lg:items-start lg:gap-10">
				<aside className="lg:sticky lg:top-4">
					<ProfileNav />
				</aside>
				<main className="min-w-0">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
