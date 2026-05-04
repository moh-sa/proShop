import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/features/users";
import { Link } from "@tanstack/react-router";
import { HistoryIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";

export function UserMenu(props: { user: User }) {
	const initials = props.user.name
		? props.user.name
				.split(" ")
				.map((name) => name[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "??";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar>
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					nativeButton={false}
					// TODO: update link
					render={<Link to="/" />}
				>
					<UserIcon className="size-4" />
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem
					nativeButton={false}
					// TODO: update link
					render={<Link to="/" />}
				>
					<HistoryIcon className="size-4" />
					Order History
				</DropdownMenuItem>

				{props.user.isAdmin && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							nativeButton={false}
							// TODO: update link
							render={<Link to="/" />}
							className="text-amber-600 hover:bg-amber-600/10 hover:text-amber-600 focus:bg-amber-600/10 focus:text-amber-600 not-data-[variant=destructive]:focus:**:text-amber-600"
						>
							<SettingsIcon className="size-4" />
							Dashboard
						</DropdownMenuItem>
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => {
						// TODO: use signout mutation
						console.log("sign out");
					}}
				>
					<LogOutIcon className="size-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
