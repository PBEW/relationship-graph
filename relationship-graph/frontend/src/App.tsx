import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PeoplePage } from "@/pages/PeoplePage";

// Lazy-loaded: these pull in the heaviest dependencies (React Flow + d3-force
// for the graph, react-hook-form/zod/cmdk form dialogs for admin) and aren't
// needed on first paint, so keep them out of the main bundle.
const GraphPage = lazy(() => import("@/pages/GraphPage").then((m) => ({ default: m.GraphPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const PersonProfilePage = lazy(() =>
  import("@/pages/PersonProfilePage").then((m) => ({ default: m.PersonProfilePage })),
);

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route
                    index
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="people"
                    element={
                      <ProtectedRoute>
                        <PeoplePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="people/:id"
                    element={
                      <ProtectedRoute>
                        <PersonProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="graph"
                    element={
                      <ProtectedRoute>
                        <GraphPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="login" element={<LoginPage />} />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
