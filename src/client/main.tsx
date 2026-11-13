import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import "./index.css";
import { AvisoSinConexion } from "./components/AvisoSinConexion";
import { crearQueryClient, persistidor } from "./consultas";
import { Raiz, SoloAdultos } from "./Raiz";
import { Hoy } from "./pantallas/Hoy";
import { Familia, HoyDeMiembro } from "./pantallas/Familia";
import { Listas } from "./pantallas/Listas";
import { Admin } from "./pantallas/admin/Admin";
import { NuevaTarea } from "./pantallas/admin/NuevaTarea";
import { EditarTarea } from "./pantallas/admin/EditarTarea";
import { AdminMiembros, EditarMiembro, NuevoMiembro } from "./pantallas/admin/Miembros";
import { AdminTareas } from "./pantallas/admin/Tareas";
import { AdminAcceso } from "./pantallas/admin/Acceso";

const queryClient = crearQueryClient();

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { index: true, element: <Navigate to="/hoy" replace /> },
      { path: "hoy", element: <Hoy /> },
      { path: "listas", element: <Navigate to="/listas/super" replace /> },
      { path: "listas/:lista", element: <Listas /> },
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
          { path: "admin/acceso", element: <AdminAcceso /> },
        ],
      },
      { path: "*", element: <Navigate to="/hoy" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: persistidor, maxAge: 7 * 24 * 60 * 60 * 1000, buster: __VERSION__ }}
    >
      <AvisoSinConexion />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </PersistQueryClientProvider>
  </StrictMode>,
);
