import { cn } from "@/lib/utils";

/** Contenedor mobile first de una pantalla completa. */
export function Pantalla({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-28", className)}>{children}</main>;
}

export function Titulo({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-3xl font-bold tracking-tight">{children}</h1>;
}

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-muted-foreground">{ayuda}</span>}
    </label>
  );
}

export function MensajeError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      {children}
    </p>
  );
}
