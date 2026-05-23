import { Card, CardDescription, CardHeader, CardTitle } from "./card";

type StatCardProps = {
	label: string;
	value: number;
	description?: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};
export function StatCard(props: StatCardProps) {
	const Icon = props.icon;

	return (
		<Card size="sm" className="px-4">
			<CardHeader className="px-0">
				<div className="relative flex items-start justify-between gap-2">
					<div className="z-10">
						<CardDescription>{props.label}</CardDescription>
						<CardTitle className="mt-1 font-heading text-3xl tabular-nums">
							{props.value}
						</CardTitle>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{props.description}
						</p>
					</div>
					<Icon className="absolute top-1/2 right-0 z-0 mt-1 size-20 -translate-y-1/2 rotate-12 text-muted" />
				</div>
			</CardHeader>
		</Card>
	);
}
