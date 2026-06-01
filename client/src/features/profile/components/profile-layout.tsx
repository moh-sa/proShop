import { SidebarLayout } from "@/shared/layout/sidebar/sidebar.layout";
import { ProfileNav } from "./profile-nav";

export function ProfileLayout() {
	return <SidebarLayout nav={<ProfileNav />} />;
}
