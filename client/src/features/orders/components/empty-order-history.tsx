import { EmptyState } from "@/components/ui/empty-state";
import { PackageOpenIcon } from "lucide-react";

export function EmptyOrderHistory() {
	return (
		<EmptyState
			icon={PackageOpenIcon}
			title="No orders yet"
			description="You haven't placed any orders yet. Your order history will appear here once you do."
			ctaLabel="Start shopping"
			ctaTo="/"
		/>
	);
}
