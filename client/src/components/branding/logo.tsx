import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type LogoProps = {
	className?: React.HTMLAttributes<HTMLDivElement>["className"];
};

export function Logo(props: LogoProps) {
	return (
		<div
			className={cn(
				"text-3xl font-bold tracking-tight select-none",
				props.className,
			)}
		>
			<Link to="/">ProShop</Link>
		</div>
	);
}
