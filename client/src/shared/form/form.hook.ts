import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form.context";

export const { useAppForm } = createFormHook({
	fieldComponents: {},
	fieldContext,
	formContext,
	formComponents: {},
});
