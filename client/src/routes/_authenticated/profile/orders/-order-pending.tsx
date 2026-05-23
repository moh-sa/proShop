import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/features/pagination/consts";

export function OrderHistoryPending() {
	return (
		<div className="flex h-full flex-col gap-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-44 rounded-md" />
				<Skeleton className="h-4 w-28 rounded-md" />
			</div>
			<ul className="space-y-2">
				{Array.from({ length: Math.min(DEFAULT_PAGE_SIZE, 5) }).map(
					(_, index) => (
						<li key={index}>
							<Skeleton className="h-28 w-full rounded-xl" />
						</li>
					),
				)}
			</ul>
			<Skeleton className="mx-auto h-10 w-full max-w-md rounded-md" />
		</div>
	);
}

export function OrderDetailPending() {
	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<Skeleton className="h-4 w-40 rounded-md" />
			<div className="space-y-2">
				<Skeleton className="h-8 w-56 rounded-md" />
				<Skeleton className="h-4 w-36 rounded-md" />
			</div>
			<Skeleton className="h-96 w-full rounded-xl" />
		</div>
	);
}
