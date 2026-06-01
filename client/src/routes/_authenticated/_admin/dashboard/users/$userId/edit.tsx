import { UserEditForm } from "@/features/admin/components";
import { adminUserDetailQueryOptions } from "@/features/admin/queries";
import { adminPaginatedSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/users/$userId/edit",
)({
	validateSearch: adminPaginatedSearchSchema,
	async loader({ context, params }) {
		await context.client.ensureQueryData(
			adminUserDetailQueryOptions(params.userId),
		);
	},
	component: EditUserPage,
});

function EditUserPage() {
	const search = Route.useSearch();
	const { userId } = Route.useParams();
	const { data: user } = useSuspenseQuery(adminUserDetailQueryOptions(userId));

	return <UserEditForm user={user} search={search} />;
}
