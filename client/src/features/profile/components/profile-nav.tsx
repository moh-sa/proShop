import {
	SidebarNav,
	type SidebarNavItem,
} from "@/shared/layout/sidebar/sidebar-nav";
import { HistoryIcon, PencilIcon, UserIcon } from "lucide-react";

const NAV_ITEMS: readonly SidebarNavItem[] = [
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
	return <SidebarNav label="Account" items={NAV_ITEMS} />;
}
