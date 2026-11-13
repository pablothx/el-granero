import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import "./index.css";
import { ErrorApi } from "./api";
import { Raiz, SoloAdultos } from "./Raiz";
import { Hoy } from "./pantallas/Hoy";
import { Familia, HoyDeMiembro } from "./pantallas/Familia";
import { Admin } from "./pantallas/admin/Admin";
import { NuevaTarea } from "./pantallas/admin/NuevaTarea";
import { EditarTarea } from "./pantallas/admin/EditarTarea";
import { AdminMiembros, EditarMiembro, NuevoMiembro } from "./pantallas/admin/Miembros";
import { AdminTareas } from "./pantallas/admin/Tareas";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ver spec: los datos se refrescan al volver a la app y cada ~15 s.
      refetchOnWindowFocus: true,
      refetchInterval: 15_000,
      // Solo se reintentan los errores de red, no las respuestas de la API.
      retry: (intentos, error) => intentos < 1 && (!(error instanceof ErrorApi) || error.codigo === "sin_conexion"),
    },
  },
});

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { index: true, element: <Navigate to="/hoy" replace /> },
      { path: "hoy", element: <Hoy /> },
      {
        element: <SoloAdultos />,
        children: [
          { path: "familia", element: <Familia /> },
          { path: "familia/:id", element: <HoyDeMiembro /> },
          { path: "admin", element: <Admin /> },
          { path: "admin/tareas", element: <AdminTareas /> },
          { path: "admin/tareas/nueva", element: <NuevaTarea /> },
          { path: "admin/tareas/:id", element: <EditarTarea /> },
          { path: "admin/miembros", element: <AdminMiembros /> },
          { path: "admin/miembros/nuevo", element: <NuevoMiembro /> },
          { path: "admin/miembros/:id", element: <EditarMiembro /> },
        ],
      },
      { path: "*", element: <Navigate to="/hoy" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  </StrictMode>,
);
