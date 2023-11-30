import { type InputHTMLAttributes } from "react";
import { classNames } from "~/utils/misc";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  otherClass?: string;
}

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
