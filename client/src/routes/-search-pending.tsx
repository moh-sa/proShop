import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/features/pagination/consts";

export function SearchRoutePending() {
	return (
		<div className="flex h-full flex-col gap-8">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 max-w-2xl rounded-md" aria-hidden />
				<Skeleton className="h-5 w-44 rounded-md" aria-hidden />
			</div>

			<section className="flex h-full flex-col justify-between">
				<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
					{Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, index) => (
						<li key={index}>
							<Skeleton className="min-h-112 w-full rounded-3xl" aria-hidden />
						</li>
					))}
				</ul>
				<Skeleton
					className="mx-auto h-10 w-full max-w-md rounded-md"
					aria-hidden
				/>
			</section>
		</div>
	);
}
