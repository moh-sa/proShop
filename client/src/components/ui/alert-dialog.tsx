import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";

function AlertDialog({ ...props }: React.ComponentProps<typeof Dialog>) {
	return <Dialog data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
	...props
}: React.ComponentProps<typeof DialogTrigger>) {
	return <DialogTrigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogContent({
	className,
	...props
}: React.ComponentProps<typeof DialogContent>) {
	return (
		<DialogContent
			data-slot="alert-dialog-content"
			showCloseButton={false}
			className={cn(
				"border-destructive/20 dark:border-destructive/40",
				className,
			)}
			{...props}
		/>
	);
}

function AlertDialogHeader({
	className,
	...props
}: React.ComponentProps<typeof DialogHeader>) {
	return (
		<DialogHeader
			data-slot="alert-dialog-header"
			className={cn(className)}
			{...props}
		/>
	);
}

function AlertDialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogTitle>) {
	return (
		<DialogTitle
			data-slot="alert-dialog-title"
			className={cn(className)}
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogDescription>) {
	return (
		<DialogDescription
			data-slot="alert-dialog-description"
			className={cn(className)}
			{...props}
		/>
	);
}

function AlertDialogFooter({
	className,
	...props
}: React.ComponentProps<typeof DialogFooter>) {
	return (
		<DialogFooter
			data-slot="alert-dialog-footer"
			className={cn(className)}
			{...props}
		/>
	);
}

function AlertDialogAction({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			data-slot="alert-dialog-action"
			variant="destructive"
			className={cn(className)}
			{...props}
		/>
	);
}

type AlertDialogCancelProps = {
	className?: string;
	disabled?: boolean;
	children?: React.ReactNode;
};

function AlertDialogCancel({
	className,
	disabled,
	children = "Cancel",
}: AlertDialogCancelProps) {
	return (
		<DialogClose
			data-slot="alert-dialog-cancel"
			render={
				<Button
					variant="outline"
					className={cn(className)}
					disabled={disabled}
				/>
			}
		>
			{children}
		</DialogClose>
	);
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
};
