import { type Schema } from "zod";
type FieldError = { [key: string]: string };

// turn FormData into a proper object that zod can parse
// Object.fromEntries won't work with field that contains an array of values
type FormFieldType = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[];
};
function objectify(formData: FormData) {
  const formFields: FormFieldType = {};
  formData.forEach((value, name) => {
    const isArrayField = name.endsWith("[]"); // we update name to "ingredientAmount[]"
    const fieldName = isArrayField ? name.slice(0, -2) : name;

    if (!(fieldName in formFields)) {
      formFields[fieldName] = isArrayField ? formData.getAll(name) : value;
    }
  });

  return formFields;
}

export function validateform<T>(
  formData: FormData,
  zodSchema: Schema<T>,
  successFn: (data: T) => unknown,
  errorFn: (errors: FieldError) => unknown
) {
  // safeParse doesn't work well with FormData so we need Object.fromEntries to convert it into an object
  const result = zodSchema.safeParse(objectify(formData));
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
