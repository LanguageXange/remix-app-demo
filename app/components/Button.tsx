import React, { type ButtonHTMLAttributes } from "react";
import { classNames } from "~/utils/misc";

type ButtonProps = {
  children: React.ReactNode;
  otherClass?: string;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({
  children,
  otherClass,
  isLoading,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        "flex px-3 py-2 rounded-xl justify-center text-white",
        otherClass
      )}
      {...props}
    >
      {children}
    </button>
  );
}
