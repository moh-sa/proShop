import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, type LinkOptions } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";

type BackButtonProps = {
	label: string;
	to: LinkOptions["to"];
	search?: LinkOptions["search"];
	className?: string;
};

export function BackButton(props: BackButtonProps) {
	return (
		<Button
			variant="ghost"
			size="sm"
			className={cn("mb-3 -ml-2", props.className)}
			nativeButton={false}
			render={<Link to={props.to} search={props.search} />}
		>
			<ChevronLeftIcon className="mr-1 size-4" />
			{props.label}
		</Button>
	);
}
