import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import { Inicio } from "./pantallas/Inicio";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ver spec: los datos se refrescan al volver a la app y cada ~15 s.
      refetchOnWindowFocus: true,
      refetchInterval: 15_000,
    },
  },
});

const router = createBrowserRouter([{ path: "/", element: <Inicio /> }]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
