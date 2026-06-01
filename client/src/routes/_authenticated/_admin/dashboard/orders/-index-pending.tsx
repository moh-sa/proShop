import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/layout/page";

export function OrdersIndexPending() {
	return (
		<div>
			<PageHeader title="Orders" description="?? orders" />
			<Skeleton className="h-[526px] w-full rounded-3xl" />
		</div>
	);
}
