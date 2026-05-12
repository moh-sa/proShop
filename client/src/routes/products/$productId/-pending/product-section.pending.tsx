import { Skeleton } from "@/components/ui/skeleton";

export function ProductSectionPending() {
	return (
		<div className="rounded-3xl bg-gray-100 p-2">
			<Skeleton className="min-h-112 w-full rounded-xl md:aspect-[2.05/1] md:min-h-0" />
		</div>
	);
}
