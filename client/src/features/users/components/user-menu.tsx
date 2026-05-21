import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutMutationOptions } from "@/features/auth";
import type { User } from "@/features/users";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { HistoryIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { getUserInitials } from "../helpers/get-user-initials.helper";

export function UserMenu(props: { user: User }) {
	const initials = getUserInitials(props.user.name);

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
							render={<Link to="/dashboard" />}
							className="text-amber-600 hover:bg-amber-600/10 hover:text-amber-600 focus:bg-amber-600/10 focus:text-amber-600 not-data-[variant=destructive]:focus:**:text-amber-600"
						>
							<SettingsIcon className="size-4" />
							Dashboard
						</DropdownMenuItem>
					</>
				)}

				<DropdownMenuSeparator />
				<SignOutMenuItem />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SignOutMenuItem() {
	const navigate = useNavigate();
	const signOutMutation = useMutation(signOutMutationOptions);

	function handleSignOut() {
		signOutMutation.mutate(undefined, {
			onSuccess: () => {
				navigate({ to: "/" });
			},
			onError: (error) => {
				toast.error("Failed to sign out", {
					description: error.message,
				});
			},
		});
	}

	return (
		<DropdownMenuItem variant="destructive" onClick={handleSignOut}>
			<LogOutIcon className="size-4" />
			Sign Out
		</DropdownMenuItem>
	);
}
