import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PositionSelect from "./pages/PositionSelect";
import Dashboard from "./pages/Dashboard";
import PatientRegistration from "./pages/PatientRegistration";
import VitalSigns from "./pages/VitalSigns";
import ClinicReport from "./pages/ClinicReport";
import AdminPanel from "./pages/AdminPanel";
import Research from "./pages/Research";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/position-select" element={<PositionSelect />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/registration" element={<PatientRegistration />} />
                <Route path="/vitals" element={<VitalSigns />} />
                <Route path="/clinic-report" element={<ClinicReport />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/research" element={<Research />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
