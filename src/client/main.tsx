import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import "./index.css";
import { Raiz } from "./Raiz";
import { Hoy } from "./pantallas/Hoy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ver spec: los datos se refrescan al volver a la app y cada ~15 s.
      refetchOnWindowFocus: true,
      refetchInterval: 15_000,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { index: true, element: <Navigate to="/hoy" replace /> },
      { path: "hoy", element: <Hoy /> },
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
