import { cn } from "@/lib/utils";

type TotalRowProps = {
	label: string;
	value: string;
	className?: string;
};

export function TotalRow(props: TotalRowProps) {
	return (
		<div
			className={cn(
				"flex justify-between text-muted-foreground tabular-nums",
				props.className,
			)}
		>
			<dt>{props.label}</dt>
			<dd className="text-foreground">{props.value}</dd>
		</div>
	);
}
