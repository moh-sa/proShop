import { Logo } from "@/components/branding";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, useAuth } from "@/features/auth";
import { CartButton } from "@/features/cart";
import { SearchBar } from "@/features/search";
import { UserMenu } from "@/features/users";

function AuthSection() {
	const { isAuthenticated, isLoading, user } = useAuth();

	if (isLoading) return <Skeleton className="size-8 rounded-full" />;
	return isAuthenticated && user ? <UserMenu user={user} /> : <SignInButton />;
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
