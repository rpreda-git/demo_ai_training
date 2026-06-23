import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { createAppRouter } from "./router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createAppRouter(queryClient);

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider storageKey="kanban-theme">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
