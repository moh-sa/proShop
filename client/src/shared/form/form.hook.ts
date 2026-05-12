import { createFormHook } from "@tanstack/react-form";
import { FormTextField } from "./fields/text.field";
import { fieldContext, formContext } from "./form.context";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField: FormTextField,
	},
	fieldContext,
	formContext,
	formComponents: {},
});
