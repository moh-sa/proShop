import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

export type StarRatingListProps = {
	rating: number;
	reviewCount?: number;
	showReviewsCount?: boolean;
	size?:
		| "size-0.5"
		| "size-1"
		| "size-1.5"
		| "size-2"
		| "size-2.5"
		| "size-3"
		| "size-3.5"
		| "size-4"
		| "size-5"
		| "size-6"
		| "size-7"
		| "size-8";
};

export function StarRatingList(props: StarRatingListProps) {
	const size = props.size ?? "size-3.5";
	return (
		<div className="size flex gap-1">
			<div className="flex">
				{Array.from({ length: 5 }, (_, i) => {
					const fill = Math.min(Math.max(props.rating - i, 0), 1);
					return (
						<div key={i} className={cn("relative", size)}>
							<StarIcon
								className={cn("fill-none text-muted-foreground", size)}
							/>

							{fill > 0 && (
								<div
									className="absolute inset-0"
									style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
								>
									<StarIcon
										className={cn("fill-amber-400 text-amber-400", size)}
									/>
								</div>
							)}
						</div>
					);
				})}
			</div>
			{props.showReviewsCount && (
				<span className="text-xs text-muted-foreground">
					{props.reviewCount} reviews
				</span>
			)}
		</div>
	);
}
