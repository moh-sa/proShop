import { Skeleton } from "@/components/ui/skeleton";

export function ReviewFormPending() {
	return (
		// '240px' is the current height of the review form
		<Skeleton className="min-h-[240px] w-full rounded-xl md:min-h-[280px]" />
	);
}
