type CarouselSectionProps = {
	children?: React.ReactNode;
};

export function CarouselSection({ children }: CarouselSectionProps) {
	return (
		<section className="h-[25vh] max-h-full w-full md:h-[44vh]">
			{children}
		</section>
	);
}
