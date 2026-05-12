import { createFormHook } from "@tanstack/react-form";
import { FormTextField } from "./fields/text.field";
import { FormTextareaField } from "./fields/textarea.field";
import { fieldContext, formContext } from "./form.context";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField: FormTextField,
		TextareaField: FormTextareaField,
	},
	fieldContext,
	formContext,
	formComponents: {},
});
