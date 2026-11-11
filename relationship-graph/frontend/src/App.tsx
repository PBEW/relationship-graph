import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ServerWakingBanner } from "@/components/common/ServerWakingBanner";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PeoplePage } from "@/pages/PeoplePage";

// Lazy-loaded: these pull in the heaviest dependencies (React Flow + d3-force
// for the graph, react-hook-form/zod/cmdk form dialogs for admin) and aren't
// needed on first paint, so keep them out of the main bundle. AppShell holds
// the Suspense boundary, so the navigation stays up while they load.
const GraphPage = lazy(() => import("@/pages/GraphPage").then((m) => ({ default: m.GraphPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const PersonProfilePage = lazy(() =>
  import("@/pages/PersonProfilePage").then((m) => ({ default: m.PersonProfilePage })),
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ServerWakingBanner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              {/* Everything else, 404 included, sits behind login so that the
                  navigation never shows for logged-out visitors. */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="people" element={<PeoplePage />} />
                <Route path="people/:id" element={<PersonProfilePage />} />
                <Route path="graph" element={<GraphPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
