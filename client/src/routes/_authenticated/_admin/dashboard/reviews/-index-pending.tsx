import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/layout/page";

export function ReviewsIndexPending() {
	return (
		<div>
			<PageHeader title="Reviews" description="?? reviews" />
			<Skeleton className="h-[526px] w-full rounded-3xl" />
		</div>
	);
}
