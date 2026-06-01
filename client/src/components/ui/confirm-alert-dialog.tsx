import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./alert-dialog";

type ConfirmAlertDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	actionLabel: string;
	onAction: () => void;
	isPending: boolean;
};

export function ConfirmAlertDialog(props: ConfirmAlertDialogProps) {
	return (
		<AlertDialog
			open={props.isOpen}
			onOpenChange={props.onOpenChange}
			disablePointerDismissal={props.isPending}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{props.title}</AlertDialogTitle>
					<AlertDialogDescription>{props.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={props.isPending} />
					<AlertDialogAction
						disabled={props.isPending}
						onClick={props.onAction}
					>
						{props.actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
