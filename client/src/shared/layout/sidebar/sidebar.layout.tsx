import { cn } from "@/lib/utils";
import { Outlet } from "@tanstack/react-router";

type SidebarLayoutProps = {
	nav: React.ReactNode;
	className?: string;
};

export function SidebarLayout(props: SidebarLayoutProps) {
	return (
		<div className={cn("mx-auto w-full max-w-5xl", props.className)}>
			<div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,13rem)_1fr] lg:items-start lg:gap-10">
				<aside className="touch-manipulation overflow-x-auto lg:sticky lg:top-4 lg:max-w-none lg:overflow-visible">
					{props.nav}
				</aside>
				<main className="min-w-0">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
