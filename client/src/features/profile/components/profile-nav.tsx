import { Link } from "@tanstack/react-router";
import { HistoryIcon, PencilIcon, UserIcon } from "lucide-react";

const NAV_ITEMS = [
	{
		label: "Overview",
		to: "/profile" as const,
		icon: UserIcon,
		exact: true,
	},
	{
		label: "Edit Profile",
		to: "/profile/edit" as const,
		icon: PencilIcon,
		exact: false,
	},
	{
		label: "Order History",
		to: "/profile/orders" as const,
		icon: HistoryIcon,
		exact: false,
	},
] as const;

export function ProfileNav() {
	return (
		<nav className="flex flex-col gap-1">
			<p className="mb-2 hidden px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase lg:block">
				Account
			</p>
			<ul className="flex touch-manipulation gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] lg:flex-col lg:overflow-visible lg:pb-0">
				{NAV_ITEMS.map((item) => {
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
