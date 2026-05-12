import { cn } from "@/lib/utils";

export type ReviewCardProps = {
	className?: string;
	children: React.ReactNode;
};

export function ReviewCard(props: ReviewCardProps) {
	return (
		<div className={cn("rounded-xl bg-gray-100 p-2", props.className)}>
			{props.children}
		</div>
	);
}
