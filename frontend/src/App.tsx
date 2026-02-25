import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import OldFilesPage from "./pages/OldFilesPage";
import AboutPage from "./pages/AboutPage";
import SettingsLayout from "./pages/settings/SettingsLayout";
import GeneralSettings from "./pages/settings/GeneralSettings";
import MatchingWords from "./pages/settings/MatchingWords";
import RemoveWords from "./pages/settings/RemoveWords";
import { ToastProvider } from "./components/Toast";
import { TranslationProvider } from "./contexts/TranslationContext";

export default function App() {
  return (
    <ToastProvider>
      <TranslationProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/files" element={<OldFilesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<GeneralSettings />} />
                <Route path="matching" element={<MatchingWords />} />
                <Route path="removal" element={<RemoveWords />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TranslationProvider>
    </ToastProvider>
  );
}
