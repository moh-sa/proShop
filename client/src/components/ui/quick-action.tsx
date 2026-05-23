import { Link, type LinkOptions } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { Card, CardHeader } from "./card";

type QuickActionCardProps = {
	to: LinkOptions["to"];
	title: string;
	description: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};
export function QuickActionCard(props: QuickActionCardProps) {
	const Icon = props.icon;

	return (
		<Card className="relative hover:bg-muted/40">
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
						<Icon className="size-5" />
					</div>
					<div className="min-w-0 flex-1">
						<Link
							to={props.to}
							className="font-medium text-foreground capitalize after:absolute after:inset-0"
						>
							{props.title}
						</Link>
						<p className="text-sm text-muted-foreground">{props.description}</p>
					</div>
					<ChevronRightIcon className="size-5 shrink-0 self-center text-muted-foreground" />
				</div>
			</CardHeader>
		</Card>
	);
}
