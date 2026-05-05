import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as React from "react";

/** Narrow shape for TanStack Form field render props — only what the UI needs. */
export type FormTextFieldField = {
	name: string;
	state: {
		value: string;
		meta: {
			errors: ReadonlyArray<{ message?: string } | undefined>;
		};
	};
	handleChange: (value: string) => void;
	handleBlur?: () => void;
};

export type FormTextFieldProps = {
	field: FormTextFieldField;
	label: string;
	type: React.HTMLInputTypeAttribute;
	placeholder: string;
	autoComplete?: string;
	required?: boolean;
	className?: string;
};

export function FormTextField({
	field,
	label,
	type,
	placeholder,
	autoComplete,
	required,
	className,
}: FormTextFieldProps) {
	const errors = field.state.meta.errors;
	const errorText = errors
		.map((e) => e?.message)
		.filter(Boolean)
		.join(", ");

	return (
		<div className={cn(className)}>
			<label
				htmlFor={field.name}
				className="leading-5 font-semibold select-none"
			>
				{label}
				{required ? <span className="text-destructive">*</span> : null}
			</label>
			<Input
				required={required}
				id={field.name}
				name={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				type={type}
				autoComplete={autoComplete}
				placeholder={placeholder}
				aria-invalid={errors.length > 0}
			/>
			{errors.length > 0 && (
				<p className="text-sm text-wrap text-destructive">{errorText}</p>
			)}
		</div>
	);
}
