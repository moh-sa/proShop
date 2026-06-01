import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/layout/page";

export function UsersIndexPending() {
	return (
		<div>
			<PageHeader title="Users" description="?? users" />
			<Skeleton className="h-[526px] w-full rounded-3xl" />
		</div>
	);
}
