import { ProductForm } from "@/features/admin/components";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/products/new",
)({
	component: NewProductPage,
});

function NewProductPage() {
	return <ProductForm mode="create" />;
}
