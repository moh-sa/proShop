import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function SignInButton() {
	return (
		<Button nativeButton={false} render={<Link to="/signin" />}>
			Sign In
		</Button>
	);
}
