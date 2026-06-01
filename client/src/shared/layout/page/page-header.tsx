import { cn } from "@/lib/utils";

export type PageHeaderProps = {
	title: string;
	description?: string;
	className?: string;
	/** Optional actions rendered to the right of the heading (e.g. a primary action button). */
	actions?: React.ReactNode;
};

export function PageHeader(props: PageHeaderProps) {
	const heading = (
		<>
			<h1 className="text-2xl font-bold tracking-tight">{props.title}</h1>
			{props.description ? (
				<p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
			) : null}
		</>
	);

	if (props.actions) {
		return (
			<div
				className={cn(
					"mb-6 flex items-center justify-between gap-4",
					props.className,
				)}
			>
				<div>{heading}</div>
				{props.actions}
			</div>
		);
	}

	return <div className={cn("mb-6", props.className)}>{heading}</div>;
}
