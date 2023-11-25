import React, { type ButtonHTMLAttributes } from "react";
import { classNames } from "~/utils/misc";

type ButtonProps = {
  children: React.ReactNode;
  otherClass?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ children, otherClass, ...props }: ButtonProps) {
  return (
    <button
      className={classNames(
        "flex px-3 py-2 rounded-lg justify-center",
        "text-white bg-primary hover:bg-primary-light",
        otherClass
      )}
      {...props}
    >
      {children}
    </button>
  );
}
