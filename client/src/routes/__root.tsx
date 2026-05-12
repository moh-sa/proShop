import { Logo } from "@/components/branding";
import { Skeleton } from "@/components/ui/skeleton";
import { getMeQueryOptions, SignInButton, useAuth } from "@/features/auth";
import { CartButton } from "@/features/cart";
import { SearchBar } from "@/features/search";
import { UserMenu } from "@/features/users";
import { AppProvider } from "@/providers/app.provider";
import type { RouterContext } from "@/shared/router";
import {
	createRootRouteWithContext,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React from "react";

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context }) => {
		const user = await context.client.ensureQueryData(getMeQueryOptions);
		return { user };
	},
	component: RootLayout,
});

function RootLayout() {
	const router = useRouter();
	const { user } = useAuth();
	const prevUserRef = React.useRef(user);

	React.useEffect(() => {
		// 'useAuth' uses 'refetchInterval' to keep the session fresh
		// if the session got invalidated, invalidate the router to re-apply route guards
		if (prevUserRef.current?.id !== user?.id) {
			router.invalidate();
			prevUserRef.current = user;
		}
	}, [user, router]);

	return (
		<AppProvider>
			<div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
				<Header />
				<Main />
				<Footer />
			</div>
			<TanStackRouterDevtools />
		</AppProvider>
	);
}

// HEADER
function AuthSection() {
	const { isAuthenticated, isLoading, user } = useAuth();

	if (isLoading) return <Skeleton className="size-8 rounded-full" />;
	return isAuthenticated && user ? <UserMenu user={user} /> : <SignInButton />;
}

function Header() {
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

// MAIN
function Main() {
	return (
		<main id="main-content">
			<div className="container mx-auto h-full px-4 py-4 sm:px-6 sm:py-6">
				<Outlet />
			</div>
		</main>
	);
}

// FOOTER
function Footer() {
	return (
		<footer className="border-t bg-background">
			<div className="container mx-auto flex flex-row items-center justify-between px-4 py-4 text-muted-foreground sm:px-6">
				<Logo className="text-lg hover:text-foreground" />
				<div className="inline-flex items-center gap-1">
					<span>Built by </span>
					<a
						className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
						href="https://github.com/moh-sa/proshop"
						target="_blank"
					>
						<img
							src="https://github.com/moh-sa.png"
							alt="my github avatar"
							className="size-4 rounded-full"
						/>
						<span>Moh-sa</span>
					</a>
				</div>
			</div>
		</footer>
	);
}
