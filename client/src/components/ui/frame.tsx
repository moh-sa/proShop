import { cn } from "@/lib/utils";
import { Polymorphic, type PolymorphicProps } from "./Polymorphic";

export function Frame<T extends React.ElementType = "div">(props: PolymorphicProps<T>) {
	return (
		<Polymorphic
			{...props}
			className={cn("rounded-3xl bg-gray-100 p-2", props.className)}
		/>
	);
}

export function FramePanel<T extends React.ElementType = "div">(props: PolymorphicProps<T>) {
	return (
		<Polymorphic
			{...props}
			className={cn("rounded-xl border border-gray-300/50 bg-white", props.className)}
		/>
	);
}
