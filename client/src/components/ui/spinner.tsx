import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

type SpinnerProps = {
	className?: string;
};

export function Spinner(props: SpinnerProps) {
	return <LoaderCircle className={cn("animate-spin", props.className)} />;
}
