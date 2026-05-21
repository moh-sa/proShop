import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { useFieldContext } from "../form.context";

type FormTextareaFieldProps = {
	label: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
};

export function FormTextareaField(props: FormTextareaFieldProps) {
	const field = useFieldContext<string>();

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
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value}
				placeholder={props.placeholder}
				required={props.required}
				aria-invalid={isInvalid}
				onChange={(e) => field.handleChange(e.target.value)}
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
