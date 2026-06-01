import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { createProductMutationOptions, updateProductMutationOptions } from "@/features/admin/queries";
import {
	createImageSchema,
	productSchema,
	updateImageSchema
} from "@/features/products/schemas";
import type { Product } from "@/features/products/types";
import { ErrorAlert } from "@/shared/errors";
import { useAppForm } from "@/shared/form";
import { BackButton, PageHeader } from "@/shared/layout/page";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

type ProductFormMode = { mode: "create" } | { mode: "edit"; product: Product };

type ProductFormProps = ProductFormMode & { search?: Record<string, unknown> };

export function ProductForm(props: ProductFormProps) {
	const navigate = useNavigate();
	const isEdit = props.mode === "edit";

	const createMutation = useMutation(createProductMutationOptions);
	const updateMutation = useMutation(updateProductMutationOptions);
	const isPending = createMutation.isPending || updateMutation.isPending;

	const product = isEdit ? props.product : undefined;

	const form = useAppForm({
		defaultValues: {
			name: product?.name ?? "",
			description: product?.description ?? "",
			brand: product?.brand ?? "",
			category: product?.category ?? "",
			price: product?.price ?? 0,
			countInStock: product?.countInStock ?? 0,
			image: null as File | null,
		},
		onSubmit: async ({ value }) => {
			const onSuccess = () =>
				navigate({ to: "/dashboard/products", search: props.search });

			const sharedFields = {
				name: value.name,
				description: value.description,
				brand: value.brand,
				category: value.category,
				price: value.price,
				countInStock: value.countInStock,
			};

			if (props.mode === "edit") {
				await updateMutation.mutateAsync(
					{
						productId: props.product.id,
						...sharedFields,
						image: value.image ?? undefined,
					},
					{ onSuccess },
				);
			} else {
				// `createImageValidator` ensures value.image is a File here
				await createMutation.mutateAsync(
					{ ...sharedFields, image: value.image as File },
					{ onSuccess },
				);
			}
		},
	});

	return (
		<div>
			<BackButton
				label="Back to Products"
				to="/dashboard/products"
				search={props.search}
			/>
			<PageHeader title={isEdit ? "Edit Product" : "New Product"} />

			{createMutation.isError || updateMutation.isError ? (
				<ErrorAlert
					title={`Could not ${isEdit ? "update" : "create"} product`}
					message={
						createMutation.error?.message ??
						updateMutation.error?.message ??
						"An unknown error occurred"
					}
					className="mb-4"
				/>
			) : null}

			<Frame className="max-w-5xl">
				<FramePanel className="p-6">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.AppField
							name="name"
							validators={{ onChange: productSchema.shape.name }}
						>
							{(field) => (
								<field.TextField
									label="Name"
									type="text"
									autoComplete="off"
									required
								/>
							)}
						</form.AppField>

						<form.AppField
							name="description"
							validators={{ onChange: productSchema.shape.description }}
						>
							{(field) => <field.TextareaField label="Description" required />}
						</form.AppField>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<form.AppField
								name="brand"
								validators={{ onChange: productSchema.shape.brand }}
							>
								{(field) => (
									<field.TextField
										label="Brand"
										type="text"
										autoComplete="off"
										required
									/>
								)}
							</form.AppField>

							<form.AppField
								name="category"
								validators={{ onChange: productSchema.shape.category }}
							>
								{(field) => (
									<field.TextField
										label="Category"
										type="text"
										autoComplete="off"
										required
									/>
								)}
							</form.AppField>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<form.AppField
								name="price"
								validators={{ onChange: productSchema.shape.price }}
							>
								{(field) => (
									<field.NumberField
										label="Price ($)"
										min={0.01}
										step={0.01}
										required
									/>
								)}
							</form.AppField>

							<form.AppField
								name="countInStock"
								validators={{ onChange: productSchema.shape.countInStock }}
							>
								{(field) => (
									<field.NumberField label="Stock" min={0} step={1} required />
								)}
							</form.AppField>
						</div>

						<form.AppField
							name="image"
							validators={{
								onChange: isEdit ? updateImageSchema : createImageSchema,
							}}
						>
							{(field) => (
								<field.ImageField
									label="Product Image"
									currentImageUrl={product?.image}
									required={!isEdit}
								/>
							)}
						</form.AppField>

						<form.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button type="submit" disabled={isPending || !canSubmit}>
									{isPending
										? "Saving..."
										: isEdit
											? "Save Changes"
											: "Create Product"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</FramePanel>
			</Frame>
		</div>
	);
}
