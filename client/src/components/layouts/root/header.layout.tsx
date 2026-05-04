import { Logo } from "@/components/branding";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/features/auth";
import { CartButton } from "@/features/cart";
import { SearchBar } from "@/features/search";
import { UserMenu, type User } from "@/features/users";

function AuthSection() {
	// TODO: get user from `useAuth` hook
	const isLoading = false;
	const isAuthenticated = true;
	const user: User | null = isAuthenticated
		? {
				id: "1",
				name: "John Doe",
				email: "john.doe@example.com",
				isAdmin: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
		: null;

	if (isLoading) return <Skeleton className="size-8 rounded-full" />;
	return user ? <UserMenu user={user} /> : <SignInButton />;
}

export function Header() {
	return (
		<header className="border-b bg-background">
			<div className="container mx-auto grid grid-cols-3 grid-rows-2 items-center gap-4 px-4 py-4 sm:grid-rows-1">
				<div className="col-span-1 col-start-1 row-start-1">
					<Logo />
				</div>

				{/*  SEARCH BAR */}
				<div className="col-span-full col-start-1 row-start-2 w-full sm:col-span-1 sm:col-start-2 sm:row-start-1">
					<SearchBar />
				</div>

				{/* NAVIGATION */}
				<nav className="col-span-1 col-start-3 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-3">
					<CartButton />
					<AuthSection />
				</nav>
			</div>
		</header>
	);
}
