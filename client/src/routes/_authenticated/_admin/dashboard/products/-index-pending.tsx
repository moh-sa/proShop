import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/layout/page";

export function ProductsIndexPending() {
	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<PageHeader
					title="Products"
					description="?? products"
					className="m-0"
				/>
				<Skeleton className="h-7 w-28" />
			</div>
			<Skeleton className="h-[526px] w-full rounded-3xl" />
		</div>
	);
}
