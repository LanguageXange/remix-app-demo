import React, { type HTMLAttributes } from "react";
import { classNames } from "~/utils/misc";

interface ErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  otherClass?: string;
  children?: React.ReactNode;
}

export function ErrorMessage({
  otherClass,
  children,
  ...props
}: ErrorMessageProps) {
  return children ? (
    <p className={classNames("text-red-600 text-xs", otherClass)} {...props}>
      {children}
    </p>
  ) : null;
}
