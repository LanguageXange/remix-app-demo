import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "~/utils/misc";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  otherClass?: string;
  error?: boolean;
}

// primary input for sign in / up
export function PrimaryInput({ otherClass, ...props }: InputProps) {
  return (
    <input
      className={classNames(
        "w-full outline-none border-2 border-gray-200",
        "focus:border-primary rounded-lg p-2",
        otherClass
      )}
      {...props}
    />
  );
}

// for shelf name and recipe name input

export const GeneralInput = forwardRef<HTMLInputElement, InputProps>(
  function MyInput({ error, otherClass, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={classNames(
          "w-full outline-none",
          "border-b-2 border-b-background focus:border-b-primary",
          error ? "border-b-red-600" : "",
          otherClass
        )}
        {...props}
      />
    );
  }
);

// for the meal plan modal
interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}
export function IconInput({ icon, ...props }: IconInputProps) {
  return (
    <div
      className={classNames(
        "flex items-stretch border-2 border-gray-300 rounded-md",
        "focus-within:border-primary"
      )}
    >
      <div className="px-2 flex flex-col justify-center">{icon}</div>
      <input className="w-full py-3 px-2 outline-none rounded-md" {...props} />
    </div>
  );
}
