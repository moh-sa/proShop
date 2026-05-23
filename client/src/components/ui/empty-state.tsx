import { cn } from "@/lib/utils";
import { Link, type LinkOptions } from "@tanstack/react-router";
import { Button } from "./button";

type EmptyStateProps = {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	title: string;
	description: string;
	ctaLabel?: string;
	ctaTo?: LinkOptions["to"];
	className?: string;
};

export function EmptyState(props: EmptyStateProps) {
	const Icon = props.icon;

	return (
		<div className={cn("text-center", props.className)}>
			<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
				<Icon className="size-8 text-muted-foreground" />
			</div>
			<h2 className="mb-2 text-xl font-semibold">{props.title}</h2>
			<p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
				{props.description}
			</p>
			{props.ctaLabel && props.ctaTo ? (
				<Button nativeButton={false} render={<Link to={props.ctaTo} />}>
					{props.ctaLabel}
				</Button>
			) : null}
		</div>
	);
}
