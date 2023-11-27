import { type Schema } from "zod";
type FieldError = { [key: string]: string };

export function validateform<T>(
  formData: FormData,
  zodSchema: Schema<T>,
  successFn: (data: T) => unknown,
  errorFn: (errors: FieldError) => unknown
) {
  // safeParse doesn't work well with FormData so we need Object.fromEntries to convert it into an object
  const result = zodSchema.safeParse(Object.fromEntries(formData));
  // result is an object { success:true, data:{...}}
  // { success:false, error:{}}
  if (!result.success) {
    const errors: FieldError = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    });
    return errorFn(errors);
  }

  return successFn(result.data);
}
