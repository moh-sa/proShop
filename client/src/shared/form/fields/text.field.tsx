import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFieldContext } from "../form.context";

type FormTextFieldProps = {
	label: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	type: Extract<
		React.HTMLInputTypeAttribute,
		"text" | "password" | "email" | "url" | "number" | "search"
	>;
	autoComplete: React.HTMLInputAutoCompleteAttribute;
};

export function FormTextField(props: FormTextFieldProps) {
	const field = useFieldContext<string>();

	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

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
				type={props.type}
				value={field.state.value}
				placeholder={props.placeholder}
				autoComplete={props.autoComplete}
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
