import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute, { PublicOnlyRoute } from "./components/ProtectedRoute.jsx";
import AnalyzePage from "./pages/AnalyzePage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import RankPage from "./pages/RankPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SkillsPage from "./pages/SkillsPage.jsx";

// The dashboard pulls in the chart library, which is large. Loading it
// lazily keeps the login page small and fast.
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.jsx"));

export default function App() {
  return (
    <Routes>
      {/* only for logged-out visitors */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* everything below needs a login and shares the sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/results/:matchId" element={<ResultPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route
            path="/reports"
            element={
              <Suspense fallback={null}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
