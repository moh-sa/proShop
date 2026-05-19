import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, TriangleAlert } from "lucide-react";

interface ErrorAlertProps {
	title?: string;
	message: string | string[];
	className?: string;
	onRetry?: () => void;
}

export function ErrorAlert(props: ErrorAlertProps) {
	const messages = Array.isArray(props.message)
		? props.message
		: [props.message];

	return (
		<div
			role="alert"
			aria-live="assertive"
			className={cn(
				"flex w-full flex-col items-center justify-center gap-4",
				props.className,
			)}
		>
			<Alert variant="destructive" className="w-full max-w-md">
				<TriangleAlert className="h-4 w-4" />

				<AlertTitle>{props.title}</AlertTitle>

				<AlertDescription>
					{messages.length === 1 ? (
						messages[0]
					) : (
						<ul className="mt-1 ml-1 list-inside list-disc space-y-1">
							{messages.map((msg) => (
								<li key={msg}>{msg}</li>
							))}
						</ul>
					)}
				</AlertDescription>
				{props.onRetry ? (
					<AlertAction className="h-full">
						<Button
							className="text-black"
							variant="outline"
							size="sm"
							onClick={props.onRetry}
						>
							<RefreshCw className="mr-2 h-3.5 w-3.5" />
							Try again
						</Button>
					</AlertAction>
				) : null}
			</Alert>
		</div>
	);
}
