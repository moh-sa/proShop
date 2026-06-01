import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFieldContext } from "../form.context";

type FormNumberFieldProps = {
	label: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	autoComplete?: React.HTMLInputAutoCompleteAttribute;
	min?: number;
	max?: number;
	step?: number;
};

export function FormNumberField(props: FormNumberFieldProps) {
	const field = useFieldContext<number>();

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const displayValue = Number.isNaN(field.state.value) ? "" : field.state.value;

	return (
		<div>
			<Label
				htmlFor={field.name}
				className="leading-5 font-semibold select-none"
			>
				{props.label}
				{props.required ? <span className="text-destructive">*</span> : null}
			</Label>

			<Input
				id={field.name}
				name={field.name}
				type="number"
				value={displayValue}
				placeholder={props.placeholder}
				autoComplete={props.autoComplete}
				required={props.required}
				min={props.min}
				max={props.max}
				step={props.step}
				aria-invalid={isInvalid}
				onChange={(e) => field.handleChange(e.target.valueAsNumber)}
				onBlur={field.handleBlur}
			/>

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
