import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import type { ProductTopRatedList } from "@/features/products/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowRightIcon } from "lucide-react";
import React from "react";

type TopRatedCarouselProps = {
	products: ProductTopRatedList;
};

export function TopRatedCarousel({ products }: TopRatedCarouselProps) {
	const [api, setApi] = React.useState<UseEmblaCarouselType[1]>();
	const [current, setCurrent] = React.useState(0);

	const plugins = React.useMemo(
		() => [Autoplay({ delay: 4000, stopOnInteraction: false })],
		[],
	);

	React.useEffect(() => {
		if (!api) return;

		setCurrent(api.selectedScrollSnap());

		const onSelect = () => setCurrent(api.selectedScrollSnap());
		api.on("select", onSelect);

		return () => {
			api.off("select", onSelect);
		};
	}, [api]);

	if (products.length === 0) return null;

	return (
		<div className="flex h-full flex-col space-y-2">
			<Carousel
				className="min-h-0"
				setApi={setApi}
				opts={{ loop: true }}
				plugins={plugins}
				onMouseEnter={() => api?.plugins()?.autoplay?.stop()}
				onMouseLeave={() => api?.plugins()?.autoplay?.play()}
			>
				<CarouselContent>
					{products.map((product) => (
						<CarouselItem key={product.id}>
							<article className="group relative h-full w-full overflow-hidden rounded-lg">
								<img
									src={product.image}
									alt={product.name}
									className="h-full w-full object-cover"
								/>

								<div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/30 to-transparent p-6 text-white">
									<p className="text-xs font-medium tracking-widest uppercase opacity-70">
										Featured
									</p>
									<h2 className="mt-1 text-xl font-bold sm:text-3xl">
										<Link
											to="/products/$productId"
											params={{ productId: product.id }}
											className="after:absolute after:inset-0"
										>
											{product.name}
										</Link>
									</h2>
									<div className="flex items-center justify-between">
										<span className="text-lg font-semibold sm:text-2xl">
											${product.price}
										</span>
										<div className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all group-hover:bg-muted group-hover:text-foreground">
											<span>View Product</span>
											<ArrowRightIcon aria-hidden="true" className="size-4" />
										</div>
									</div>
								</div>
							</article>
						</CarouselItem>
					))}
				</CarouselContent>
			</Carousel>

			<div className="flex items-center justify-center gap-2">
				{products.map((_, index) => (
					<button
						key={index}
						onClick={() => api?.scrollTo(index)}
						className={cn(
							"h-2 cursor-pointer rounded-full transition-all duration-300",
							current === index
								? "w-6 bg-primary"
								: "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60",
						)}
					/>
				))}
			</div>
		</div>
	);
}
