/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/AuthProvider";
import { ClinicProvider } from "./context/ClinicContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Appointments } from "./pages/Appointments";
import { Patients } from "./pages/Patients";
import { PatientDetails } from "./pages/PatientDetails";
import { Settings } from "./pages/Settings";
import { Messages } from "./pages/Messages";
import { Calls } from "./pages/Calls";
import { Reminders } from "./pages/Reminders";
import { Predictions } from "./pages/Predictions";
import { Analytics } from "./pages/Analytics";
import { DigitalForms } from "./pages/DigitalForms";
import { DentistVoiceNotes } from "./pages/DentistVoiceNotes";
import { Waitlist } from "./pages/Waitlist";
import { AiMemory } from "./pages/AiMemory";
import { MultimodalAi } from "./pages/MultimodalAi";
import { SelfImprovingAi } from "./pages/SelfImprovingAi";
import { GoogleWorkspace } from "./pages/GoogleWorkspace";
import { Onboarding } from "./pages/Onboarding";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClinicProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetails />} />
                <Route path="digital-forms" element={<DigitalForms />} />
                <Route path="dentist-voice-notes" element={<DentistVoiceNotes />} />
                <Route path="waitlist" element={<Waitlist />} />
                <Route path="ai-memory" element={<AiMemory />} />
                <Route path="self-improving-ai" element={<SelfImprovingAi />} />
                <Route path="visual-screener" element={<MultimodalAi />} />
                <Route path="messages" element={<Messages />} />
                <Route path="calls" element={<Calls />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="predictions" element={<Predictions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="google-workspace" element={<GoogleWorkspace />} />
                <Route path="onboarding" element={<Onboarding />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ClinicProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
