import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { Order } from "../types";
import {
	ORDER_CONFIRMATION_CONFIG,
	type OrderConfirmationVariant,
} from "./order-confirmation.config";
import { OrderReceiptCard } from "./order-receipt";

export type OrderConfirmationScreenProps = {
	variant: OrderConfirmationVariant;
	receipt: Order;
};

export function OrderConfirmationScreen(props: OrderConfirmationScreenProps) {
	const config = ORDER_CONFIRMATION_CONFIG[props.variant];
	const { Icon, iconWrapperClassName, heading, badge, actions } = config;

	return (
		<div className="min-h-dvh">
			<Frame className="mx-auto max-w-3xl">
				<FramePanel className="space-y-10 px-4 py-4 sm:px-6 lg:px-6">
					<header className="space-y-4">
						<div
							className={cn(
								"mx-auto flex size-32 shrink-0 items-center justify-center rounded-full",
								iconWrapperClassName,
							)}
						>
							<Icon className="size-16" />
						</div>
						<h1 className="text-center font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
							{heading}
						</h1>
					</header>

					<OrderReceiptCard
						headerExtra={
							<Badge
								className={cn(
									"shrink-0 text-xs tracking-wide uppercase",
									badge.className,
								)}
								variant={badge.variant}
							>
								{badge.label}
							</Badge>
						}
						receipt={props.receipt}
					/>

					<nav className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
						{actions.map((action) => {
							const ActionIcon = action.icon;
							return (
								<Button
									key={`${action.label}-${action.to}`}
									className="w-full sm:w-auto"
									nativeButton={false}
									render={<Link to={action.to} />}
									size="lg"
									variant={action.buttonVariant ?? "default"}
								>
									<ActionIcon className="size-4" />
									{action.label}
								</Button>
							);
						})}
					</nav>
				</FramePanel>
			</Frame>
		</div>
	);
}
