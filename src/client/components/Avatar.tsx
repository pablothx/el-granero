import { cn } from "@/lib/utils";

const TAMAÑOS = {
  sm: "size-9 text-xl",
  md: "size-14 text-3xl",
  lg: "size-20 text-5xl",
  xl: "size-24 text-6xl",
} as const;

export function Avatar({
  emoji,
  color,
  tamaño = "md",
  className,
}: {
  emoji: string;
  color: string;
  tamaño?: keyof typeof TAMAÑOS;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full leading-none shadow-sm", TAMAÑOS[tamaño], className)}
      style={{ backgroundColor: color }}
    >
      {emoji}
    </span>
  );
}
