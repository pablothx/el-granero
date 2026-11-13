import { useEffect, useState } from "react";
import { Button } from "./ui/button";

/** Botón para acciones delicadas: el primer toque pide confirmación, el segundo ejecuta. */
export function BotonConfirmar({
  children,
  confirmar = "¿Seguro? Tocá de nuevo",
  onConfirmar,
  variant = "outline",
  disabled,
}: {
  children: React.ReactNode;
  confirmar?: string;
  onConfirmar: () => void;
  variant?: "outline" | "destructive" | "secondary";
  disabled?: boolean;
}) {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);

  return (
    <Button
      type="button"
      size="lg"
      variant={armado ? "destructive" : variant}
      disabled={disabled}
      className="h-12 w-full text-base"
      onClick={() => {
        if (armado) {
          setArmado(false);
          onConfirmar();
        } else setArmado(true);
      }}
    >
      {armado ? confirmar : children}
    </Button>
  );
}
