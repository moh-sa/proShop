import { SidebarLayout } from "@/shared/layout/sidebar/sidebar.layout";
import { AdminSidebar } from "./sidebar";

export function AdminLayout() {
	return <SidebarLayout nav={<AdminSidebar />} className="max-w-6xl" />;
}
