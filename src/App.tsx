import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';
import { AppShell } from './components/layout/app-shell';
import { LandingPage } from './features/landing/landing-page';
import { LoginForm } from './features/auth/login-form';
import { SignupForm } from './features/auth/signup-form';
import { ForgotPasswordForm } from './features/auth/forgot-password-form';
import { OnboardingForm } from './features/onboarding/onboarding-form';
import { DashboardPage } from './features/dashboard/dashboard-page';
import { PlannerPage } from './features/planner/planner-page';

function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<SignupForm />} />
                  <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/trips/:id" element={<PlannerPage />} />
                  <Route path="/onboarding" element={<OnboardingForm />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;