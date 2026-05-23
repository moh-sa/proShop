import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Frame, FramePanel } from "@/components/ui/frame";
import { QuickActionCard } from "@/components/ui/quick-action";
import { StatCard } from "@/components/ui/stat-card";
import type { User } from "@/features/users";
import { getUserInitials } from "@/features/users/helpers/get-user-initials.helper";
import { formatDate } from "@/shared/utils";
import { HistoryIcon, MessageSquareIcon, PencilIcon } from "lucide-react";

type ProfileOverviewProps = {
	user: User;
	reviewsCount: number;
};

export function ProfileOverview(props: ProfileOverviewProps) {
	const initials = getUserInitials(props.user.name);

	return (
		<div className="space-y-8">
			<header>
				<h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
					Account Overview
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Manage your profile and view your activity.
				</p>
			</header>

			<Frame>
				<FramePanel className="flex flex-row items-center gap-6 p-6 sm:gap-8">
					<Avatar className="size-20 shrink-0 text-xl">
						<AvatarFallback className="font-medium">{initials}</AvatarFallback>
					</Avatar>
					<div className="min-w-0 space-y-1">
						<h2 className="truncate font-heading text-xl font-semibold tracking-tight">
							{props.user.name}
						</h2>
						<p className="truncate text-sm text-muted-foreground">
							{props.user.email}
						</p>
						<p className="text-sm text-muted-foreground">
							Member since{" "}
							<time dateTime={props.user.createdAt.toISOString()}>
								{formatDate(props.user.createdAt)}
							</time>
						</p>
					</div>
				</FramePanel>
			</Frame>

			<section>
				<h2 className="mb-3 text-sm font-medium tracking-wider text-muted-foreground uppercase">
					Activity
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<StatCard
						label="Reviews written"
						value={props.reviewsCount}
						icon={MessageSquareIcon}
					/>
				</div>
			</section>

			<section>
				<h2 className="mb-3 text-sm font-medium tracking-wider text-muted-foreground uppercase">
					Quick Actions
				</h2>
				<ul className="flex flex-col gap-3 md:flex-row">
					<li className="flex-1">
						<QuickActionCard
							to="/profile/edit"
							title="Edit Profile"
							description="Update your name, email, or password"
							icon={PencilIcon}
						/>
					</li>
					<li className="flex-1">
						<QuickActionCard
							to="/profile/orders"
							title="Order History"
							description="View past orders and receipts"
							icon={HistoryIcon}
						/>
					</li>
				</ul>
			</section>
		</div>
	);
}
