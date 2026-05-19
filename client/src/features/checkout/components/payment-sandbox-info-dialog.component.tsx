import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, ExternalLink, FlaskConical } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { SUCCESS_CARD_NUMBER } from "../consts";

type PaymentSandboxDialogProps = {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export function PaymentSandboxInfoDialog(props: PaymentSandboxDialogProps) {
	const [isCopied, setIsCopied] = React.useState(false);
	const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null);

	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	async function handleCopy() {
		// remove spaces
		try {
			await navigator.clipboard.writeText(
				SUCCESS_CARD_NUMBER.replace(/\s/g, ""),
			);
		} catch (error) {
			toast.error("Failed to copy card number to clipboard", {
				description: "Please try again.",
			});
			console.error(error);
			return;
		}

		setIsCopied(true);

		// clear existing timeout before setting a new one
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
	}

	return (
		<Dialog
			open={props.isOpen}
			onOpenChange={(open) => {
				if (!open) {
					props.onCancel();
				}
			}}
		>
			<DialogContent className="sm:max-w-md">
				{/* HEADER */}
				<DialogHeader>
					<div className="flex items-center gap-2">
						<FlaskConical className="h-5 w-5 text-muted-foreground" />
						<DialogTitle>Sandbox mode, no real money</DialogTitle>
					</div>
					<DialogDescription>
						Copy the test card number below to complete your purchase.
					</DialogDescription>
				</DialogHeader>

				{/* TEST CARDS */}
				<div className="space-y-3 py-1">
					<div className="flex items-center justify-between rounded-lg border px-4 py-3">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									Simulates a successful payment
								</span>
							</div>
							<p className="font-mono text-sm font-semibold tracking-widest">
								{SUCCESS_CARD_NUMBER}
							</p>
						</div>

						<Button
							variant="ghost"
							size="icon"
							onClick={handleCopy}
							className="ml-3 shrink-0"
						>
							{isCopied ? (
								<Check className="h-4 w-4 text-emerald-500" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</div>

					<p className="px-1 text-xs text-muted-foreground">
						Any future expiry (e.g. 12/34) and any 3-digit CVC will work.
					</p>
				</div>

				{/* FOOTER */}
				<DialogFooter>
					<Button variant="outline" onClick={props.onCancel}>
						Go Back
					</Button>
					<Button onClick={props.onConfirm}>
						Continue to Payment
						<ExternalLink className="size-4" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
