import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/features/pagination/consts";

export function HomeRoutePending() {
	return (
		<div className="flex h-full flex-col gap-8">
			<section className="h-[25vh] max-h-full w-full md:h-[44vh]">
				<Skeleton className="size-full rounded-xl" />
			</section>

			<section className="flex h-full flex-col justify-between gap-4">
				<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
					{Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
						<li key={index}>
							<Skeleton className="min-h-112 w-full rounded-3xl" />
						</li>
					))}
				</ul>
				<Skeleton className="mx-auto h-10 w-full max-w-md rounded-md" />
			</section>
		</div>
	);
}
