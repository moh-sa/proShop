import type { ZodError } from "zod";

const errorTemp = (error: ZodError["issues"][number]) => {
	if (error.path.length === 0) {
		return error.message;
	}
	return `${error.path.join(".")} ${error.message}`;
};
export function formatZodErrors(errors: ZodError): string {
	return errors.issues.map((error) => errorTemp(error)).join("; ");
}
