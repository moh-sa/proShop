import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import type { useCheckout } from "../hooks";
import { shippingAddressSchema } from "../schemas";

type ShippingAddressFormProps = {
	form: ReturnType<typeof useCheckout>["form"];
};

export function ShippingAddressForm({ form }: ShippingAddressFormProps) {
	function fillDemoData() {
		form.reset({
			address: "123 Main St",
			city: "New York",
			postalCode: "12345",
			country: "United States",
		});
	}

	return (
		<div>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-bold">Shipping address</h2>
					<p className="text-sm text-muted-foreground">
						Enter where we should ship your order, or use demo data.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0 gap-2"
					onClick={fillDemoData}
				>
					<Wand2 className="size-4" />
					Fill with demo data
				</Button>
			</div>

			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<form.AppField
					name="address"
					validators={{
						onChange: shippingAddressSchema.shape.address,
					}}
				>
					{(field) => (
						<field.TextField
							label="Address"
							type="text"
							autoComplete="street-address"
							placeholder="Street and number"
							required
						/>
					)}
				</form.AppField>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<form.AppField
						name="city"
						validators={{
							onChange: shippingAddressSchema.shape.city,
						}}
					>
						{(field) => (
							<field.TextField
								label="City"
								type="text"
								autoComplete="address-level2"
								placeholder="City"
								required
							/>
						)}
					</form.AppField>

					<form.AppField
						name="postalCode"
						validators={{
							onChange: shippingAddressSchema.shape.postalCode,
						}}
					>
						{(field) => (
							<field.TextField
								label="Postal code"
								type="text"
								autoComplete="postal-code"
								placeholder="ZIP / postal code"
								required
							/>
						)}
					</form.AppField>
				</div>

				<form.AppField
					name="country"
					validators={{
						onChange: shippingAddressSchema.shape.country,
					}}
				>
					{(field) => (
						<field.TextField
							label="Country"
							type="text"
							autoComplete="country-name"
							placeholder="Country"
							required
						/>
					)}
				</form.AppField>
			</form>
		</div>
	);
}
