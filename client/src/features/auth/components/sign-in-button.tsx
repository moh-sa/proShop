import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function SignInButton() {
	// TODO: update link to /signin
	return (
		<Button nativeButton={false} render={<Link to="/" />}>
			Sign In
		</Button>
	);
}
