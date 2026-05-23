import { Skeleton } from "@/components/ui/skeleton";

export function ProfileOverviewPending() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48 rounded-md" />
				<Skeleton className="h-4 w-64 rounded-md" />
			</div>
			<Skeleton className="h-36 w-full rounded-3xl" />
			<Skeleton className="h-28 w-full rounded-xl" />
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<Skeleton className="h-24 w-full rounded-xl" />
				<Skeleton className="h-24 w-full rounded-xl" />
			</div>
		</div>
	);
}
