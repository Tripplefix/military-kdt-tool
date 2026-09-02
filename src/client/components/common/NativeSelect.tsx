import * as React from "react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  size?: "sm" | "default";
}

/** Einfaches, robustes Dropdown auf Basis von <select>. */
export function NativeSelect({ options, placeholder, className, size = "default", ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        "rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        size === "sm" ? "h-7" : "h-8",
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
