import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatPrice } from "@/shared/utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { RevenueByMonthItem } from "../../schemas";

type RevenueChartProps = {
	data: Array<RevenueByMonthItem>;
};

const chartConfig = {
	revenue: {
		label: "Revenue",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export function RevenueChart(props: RevenueChartProps) {
	if (props.data.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
				No revenue data yet.
			</div>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="h-56 w-full">
			<AreaChart
				data={props.data}
				margin={{ left: 12, right: 12, top: 4 }}
			>
				<defs>
					<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="var(--color-revenue)"
							stopOpacity={0.3}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-revenue)"
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="month"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 11 }}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 11 }}
					tickFormatter={(v) => formatPrice(v)}
					width={55}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(value) => [formatPrice(value as number), " Revenue"]}
						/>
					}
				/>
				<Area
					type="monotone"
					dataKey="revenue"
					stroke="var(--color-revenue)"
					strokeWidth={2}
					fill="url(#revenueGradient)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}
