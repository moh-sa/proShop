import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { useFieldContext } from "../form.context";

type FormSelectFieldProps<T extends string | number> = {
	label: string;
	description?: string;
	items: Array<{ label: string; value: T }>;
	placeholder?: string;
	required?: boolean;
};

export function FormSelectField<T extends string | number>(
	props: FormSelectFieldProps<T>,
) {
	const field = useFieldContext<T>();

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	return (
		<div>
			<Label
				className="leading-5 font-semibold select-none"
				htmlFor={field.name}
			>
				{props.label}
				{props.required ? <span className="text-destructive">*</span> : null}
			</Label>
			<Select
				id={field.name}
				name={field.name}
				value={String(field.state.value)}
				items={props.items}
				required={props.required}
				aria-invalid={isInvalid}
				onValueChange={(value) => {
					field.handleChange(
						typeof field.state.value === "number"
							? (Number(value) as T)
							: (value as T),
					);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>{props.placeholder}</SelectLabel>
						{props.items.map((item) => (
							<SelectItem key={item.value} value={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{props.description ? (
				<span className="text-sm leading-normal font-normal text-muted-foreground">
					{props.description}
				</span>
			) : null}
			{isInvalid && (
				<p className="text-sm text-destructive">
					{field.state.meta.errors.map((error) => error.message).join(", ")}
				</p>
			)}
		</div>
	);
}
