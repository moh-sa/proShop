import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";

export function SignInButton() {
	const redirectPath = useLocation({
		select: (location) => location.pathname,
	});

	return (
		<Button
			nativeButton={false}
			render={<Link to="/signin" search={{ redirect: redirectPath }} />}
		>
			Sign In
		</Button>
	);
}
