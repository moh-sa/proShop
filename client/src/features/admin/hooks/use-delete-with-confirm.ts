import { useCallback, useState } from "react";
// biome-ignore lint/suspicious/noExplicitAny: TanStack mutation context types are opaque at the call site
import type { ClientApiError } from "@/shared/api";
import { useMutation, type MutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

type DeleteOptions = {
	successToast: string;
	errorToast: string;
};

/**
 * Encapsulates the delete-with-confirmation flow shared across admin resource
 * tables: deleteTarget state, mutation, toasts, and error state.
 *
 * @param mutationOptions - A `mutationOptions(...)` object whose `mutationFn`
 *   accepts a `string` (the resource id).
 * @param options - Toast messages shown on success/error.
 */
export function useDeleteWithConfirm<T extends { id: string }>(
	mutationOptions: MutationOptions<void, ClientApiError, string, unknown>,
	options: DeleteOptions,
) {
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
	const mutation = useMutation(mutationOptions);

	const openDeleteDialog = useCallback((target: T) => {
		setDeleteTarget(target);
	}, []);

	function closeDeleteDialog() {
		setDeleteTarget(null);
	}

	function handleConfirm() {
		if (!deleteTarget) return;

		setError(null);
		mutation.mutate(deleteTarget.id, {
			onSettled: closeDeleteDialog,
			onSuccess: () => toast.success(options.successToast),
			onError(err) {
				setError(err.message);
				toast.error(options.errorToast, { description: err.message });
			},
		});
	}

	return {
		error,
		deleteTarget,
		isPending: mutation.isPending,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirm,
	};
}
