import { createFormHook } from "@tanstack/react-form";
import { FormSelectField } from "./fields/select.field";
import { FormTextField } from "./fields/text.field";
import { FormTextareaField } from "./fields/textarea.field";
import { fieldContext, formContext } from "./form.context";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField: FormTextField,
		TextareaField: FormTextareaField,
		SelectField: FormSelectField,
	},
	fieldContext,
	formContext,
	formComponents: {},
});
