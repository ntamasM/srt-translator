import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import TranslatePage from "./pages/TranslatePage";
import OldFilesPage from "./pages/OldFilesPage";
import PackagesPage from "./pages/PackagesPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import SuggestionPackagesPage from "./pages/SuggestionPackagesPage";
import SettingsLayout from "./pages/settings/SettingsLayout";
import GeneralSettings from "./pages/settings/GeneralSettings";
import ManageData from "./pages/settings/ManageData";
import { ToastProvider } from "./components/Toast";
import { TranslationProvider } from "./contexts/TranslationContext";
import { useTheme } from "./hooks/useTheme";

function ThemeLoader() {
  useTheme();
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <TranslationProvider>
        <ThemeLoader />
        <BrowserRouter>
          <Routes>
            {/* Public landing page — no sidebar */}
            <Route path="/" element={<LandingPage />} />

            {/* Inner app — sidebar layout */}
            <Route element={<Layout />}>
              <Route path="/translate" element={<TranslatePage />} />
              <Route path="/files" element={<OldFilesPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:packageId" element={<PackageDetailPage />} />
              <Route path="/suggestion-packages" element={<SuggestionPackagesPage />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<GeneralSettings />} />
                <Route path="data" element={<ManageData />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TranslationProvider>
    </ToastProvider>
  );
}
