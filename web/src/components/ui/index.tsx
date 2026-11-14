import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  soft: "btn-soft",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const SIZE: Record<Size, string> = {
  sm: "px-2.5 py-1 text-[0.76rem]",
  md: "",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "soft", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn(VARIANT[variant], SIZE[size], className)} {...rest} />;
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border border-line bg-surface",
        "text-ink-soft transition-colors hover:border-line-strong hover:bg-paper-deep",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...rest}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface p-4 sm:p-5", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "solid" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "border-line bg-paper-deep text-ink-soft",
    accent: "border-accent/25 bg-accent-soft text-accent-ink",
    solid: "border-ink bg-ink text-paper",
    muted: "border-transparent bg-paper-deep/70 text-muted",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("field cursor-pointer py-1.5 pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Checkbox({ id, checked, onChange, children, className }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2 py-2",
        "transition-colors hover:border-line hover:bg-paper/60",
        checked && "text-muted",
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "peer size-5 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface",
            "transition-colors checked:border-accent checked:bg-accent",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
        />
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute size-3.5 text-paper opacity-0 peer-checked:opacity-100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10.5 8 14.5 16 5.5" />
        </svg>
      </span>
      <span className={cn("text-[0.9rem] leading-relaxed", checked && "line-through decoration-line-strong")}>
        {children}
      </span>
    </label>
  );
}

export { DayTargetPicker } from "./DayTargetPicker";
export type { DayTargetOption, DayTargetPickerProps } from "./DayTargetPicker";
