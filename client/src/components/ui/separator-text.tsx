import { cn } from "@/lib/utils";

interface SeparatorTextProps {
	text: string;
	className?: string;
}

export function SeparatorText({ text, className }: SeparatorTextProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-center text-muted-foreground before:mr-1 before:shrink before:grow before:border-b before:border-muted after:ml-1 after:shrink after:grow after:border-b after:border-muted",
				className,
			)}
		>
			{text}
		</div>
	);
}
