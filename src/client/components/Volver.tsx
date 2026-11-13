import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function Volver({ a, texto = "Volver" }: { a: string; texto?: string }) {
  return (
    <Link to={a} className="-ml-2 mb-2 flex w-fit items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground active:bg-muted">
      <ArrowLeft className="size-4" /> {texto}
    </Link>
  );
}
