import { CarouselSection } from "./carousel-section";
import { ProductsSection } from "./product-section";

type HomeLayoutProps = {
	carouselSlot?: React.ReactNode;
	gridSlot?: React.ReactNode;
	paginationSlot?: React.ReactNode;
};

export function HomeLayout({
	carouselSlot,
	gridSlot,
	paginationSlot,
}: HomeLayoutProps) {
	return (
		<div className="grid grid-rows-[auto_auto] gap-8">
			<CarouselSection>{carouselSlot}</CarouselSection>
			<ProductsSection gridSlot={gridSlot} paginationSlot={paginationSlot} />
		</div>
	);
}
