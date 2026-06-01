import { UsersTable } from "@/features/admin/components";
import { adminUsersQueryOptions } from "@/features/admin/queries";
import { adminPaginatedSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UsersIndexPending } from "./-index-pending";

export const Route = createFileRoute("/_authenticated/_admin/dashboard/users/")(
	{
		validateSearch: adminPaginatedSearchSchema,
		loaderDeps: ({ search }) => search,
		async loader({ context, deps }) {
			await context.client.ensureQueryData(adminUsersQueryOptions(deps));
		},
		component: UsersPage,
		pendingComponent: UsersIndexPending,
	},
);

function UsersPage() {
	const search = Route.useSearch();
	const { data } = useSuspenseQuery(adminUsersQueryOptions(search));

	return <UsersTable data={data} search={search} />;
}
