import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import OldFilesPage from "./pages/OldFilesPage";
import PackagesPage from "./pages/PackagesPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import AboutPage from "./pages/AboutPage";
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
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/files" element={<OldFilesPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:packageId" element={<PackageDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
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
