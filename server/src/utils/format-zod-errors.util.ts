import { ZodError, ZodIssue } from "zod";

const errorTemp = (error: ZodIssue) => {
  if (error.path.length === 0) return error.message;
  return `${error.path.join(".")} ${error.message}`;
};
export function formatZodErrors(errors: ZodError): string {
  return errors.errors.map((error) => errorTemp(error)).join("; ");
}
