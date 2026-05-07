import {
	Pagination as PaginationBase,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "@/shared/api";
import { buildPageWindow } from "../helpers";

type PaginationProps = PaginationMeta;

export function Pagination(props: PaginationProps) {
	if (props.totalPages <= 1) return null;

	const pageWindow = buildPageWindow(props.currentPage, props.totalPages);

	return (
		<PaginationBase>
			<PaginationContent>
				{props.hasPreviousPage && (
					<PaginationItem>
						<PaginationPrevious
							to="."
							search={(prev) => ({
								...prev,
								pageNumber: props.currentPage - 1,
							})}
						/>
					</PaginationItem>
				)}

				{pageWindow.map((entry, index) => {
					if (entry === "ellipsis") {
						return (
							<PaginationItem key={`ellipsis-${index}`}>
								<PaginationEllipsis />
							</PaginationItem>
						);
					}

					return (
						<PaginationItem key={`page-${entry}`}>
							<PaginationLink
								to="."
								search={(prev) => ({ ...prev, pageNumber: entry })}
								isActive={entry === props.currentPage}
							>
								{entry}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				{props.hasNextPage && (
					<PaginationItem>
						<PaginationNext
							to="."
							search={(prev) => ({
								...prev,
								pageNumber: props.currentPage + 1,
							})}
						/>
					</PaginationItem>
				)}
			</PaginationContent>
		</PaginationBase>
	);
}
