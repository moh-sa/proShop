import { cn } from "@/lib/utils";
import { Link, type LinkOptions } from "@tanstack/react-router";

export type SidebarNavItem = {
	label: string;
	to: LinkOptions["to"];
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	exact: boolean;
};

type SidebarNavProps = {
	label: string;
	items: readonly SidebarNavItem[];
	/** Enables horizontal scroll on mobile (needed when the nav contains many items). */
	scrollable?: boolean;
};

export function SidebarNav(props: SidebarNavProps) {
	return (
		<nav className="flex flex-col gap-1">
			<p className="mb-2 hidden px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase lg:block">
				{props.label}
			</p>
			<ul
				className={cn(
					"flex gap-1 lg:flex-col",
					props.scrollable &&
						"touch-manipulation overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:overflow-visible lg:pb-0",
				)}
			>
				{props.items.map((item) => {
					const Icon = item.icon;
					return (
						<li key={item.to} className="shrink-0">
							<Link
								to={item.to}
								activeOptions={{ exact: item.exact }}
								className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground"
								activeProps={{ className: "bg-muted text-foreground" }}
								inactiveProps={{ className: "text-muted-foreground" }}
							>
								<Icon className="size-4 shrink-0" />
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
