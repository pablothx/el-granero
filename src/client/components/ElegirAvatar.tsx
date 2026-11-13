import { COLORES_AVATAR, EMOJIS_AVATAR } from "../../shared/dominio";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export type Emoji = (typeof EMOJIS_AVATAR)[number];
export type Color = (typeof COLORES_AVATAR)[number];

export function ElegirAvatar({
  emoji,
  color,
  onCambiar,
}: {
  emoji: Emoji;
  color: Color;
  onCambiar: (avatar: { emoji: Emoji; color: Color }) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar emoji={emoji} color={color} tamaño="xl" />
      <div role="radiogroup" aria-label="Animal" className="grid grid-cols-5 gap-2">
        {EMOJIS_AVATAR.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={e === emoji}
            aria-label={e}
            onClick={() => onCambiar({ emoji: e, color })}
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-3xl transition",
              e === emoji ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Color" className="flex flex-wrap justify-center gap-2">
        {COLORES_AVATAR.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={`Color ${c}`}
            onClick={() => onCambiar({ emoji, color: c })}
            className={cn("size-9 rounded-full transition", c === color && "ring-4 ring-foreground/30 ring-offset-2 ring-offset-background")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function avatarAlAzar(): { emoji: Emoji; color: Color } {
  const azar = <T,>(lista: readonly T[]) => lista[Math.floor(Math.random() * lista.length)]!;
  return { emoji: azar(EMOJIS_AVATAR), color: azar(COLORES_AVATAR) };
}
