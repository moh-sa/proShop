export type PolymorphicProps<T extends React.ElementType> = {
	as?: T;
} & React.ComponentPropsWithoutRef<T>;

export function Polymorphic<T extends React.ElementType>({
	as,
	...props
}: PolymorphicProps<T>) {
	const Component = as ?? "div";

	return <Component {...props} />;
}
