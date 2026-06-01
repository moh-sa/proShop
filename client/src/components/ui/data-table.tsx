import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type Table as TanStackTable,
} from "@tanstack/react-table";
import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

type DataTableProps<TData> = {
	data: Array<TData>;
	columns: Array<ColumnDef<TData>>;
	toolbar?: (table: TanStackTable<TData>) => React.ReactNode;
};

export function DataTable<TData>(props: DataTableProps<TData>) {
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);

	const table = useReactTable({
		data: props.data,
		columns: props.columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnFiltersChange: setColumnFilters,
		state: {
			columnFilters,
		},
	});

	return (
		<div className="space-y-4">
			{props.toolbar ? props.toolbar(table) : null}

			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} colSpan={header.colSpan}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
