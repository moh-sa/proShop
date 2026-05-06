type ProductsSectionProps = {
	gridSlot?: React.ReactNode;
	paginationSlot?: React.ReactNode;
};

export function ProductsSection({
	gridSlot,
	paginationSlot,
}: ProductsSectionProps) {
	return (
		<section className="overflow-hidden">
			<div className="grid min-h-0 grid-rows-[1fr_auto] gap-4">
				<div className="min-h-0 overflow-hidden">{gridSlot}</div>
				<div className="flex justify-center">{paginationSlot}</div>
			</div>
		</section>
	);
}
