import { createFormHook } from "@tanstack/react-form";
import { FormImageField } from "./fields/image.field";
import { FormNumberField } from "./fields/number.field";
import { FormSelectField } from "./fields/select.field";
import { FormTextField } from "./fields/text.field";
import { FormTextareaField } from "./fields/textarea.field";
import { fieldContext, formContext } from "./form.context";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		ImageField: FormImageField,
		NumberField: FormNumberField,
		SelectField: FormSelectField,
		TextField: FormTextField,
		TextareaField: FormTextareaField,
	},
	fieldContext,
	formContext,
	formComponents: {},
});
