import {
	SidebarNav,
	type SidebarNavItem,
} from "@/shared/layout/sidebar/sidebar-nav";
import {
	LayoutDashboardIcon,
	PackageIcon,
	ShoppingCartIcon,
	StarIcon,
	UsersIcon,
} from "lucide-react";

const NAV_ITEMS: readonly SidebarNavItem[] = [
	{
		label: "Overview",
		to: "/dashboard" as const,
		icon: LayoutDashboardIcon,
		exact: true,
	},
	{
		label: "Products",
		to: "/dashboard/products" as const,
		icon: PackageIcon,
		exact: false,
	},
	{
		label: "Orders",
		to: "/dashboard/orders" as const,
		icon: ShoppingCartIcon,
		exact: false,
	},
	{
		label: "Reviews",
		to: "/dashboard/reviews" as const,
		icon: StarIcon,
		exact: false,
	},
	{
		label: "Users",
		to: "/dashboard/users" as const,
		icon: UsersIcon,
		exact: false,
	},
] as const;

export function AdminSidebar() {
	return <SidebarNav label="Admin" items={NAV_ITEMS} scrollable />;
}
