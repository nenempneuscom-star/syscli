import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/features/auth/store/auth-store';

// Layouts - loaded eagerly as they're needed for all routes
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// Auth Pages - lazy loaded
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Dashboard Pages - lazy loaded
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));

// Patients Pages - lazy loaded
const PatientsPage = lazy(() => import('@/features/patients/pages/PatientsPage').then(m => ({ default: m.PatientsPage })));
const PatientDetailPage = lazy(() => import('@/features/patients/pages/PatientDetailPage').then(m => ({ default: m.PatientDetailPage })));

// Appointments Pages - lazy loaded
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));

// Medical Records Pages - lazy loaded
const MedicalRecordsPage = lazy(() => import('@/features/medical-records/pages/MedicalRecordsPage').then(m => ({ default: m.MedicalRecordsPage })));
const MedicalRecordDetailPage = lazy(() => import('@/features/medical-records/pages/MedicalRecordDetailPage').then(m => ({ default: m.MedicalRecordDetailPage })));
const NewMedicalRecordPage = lazy(() => import('@/features/medical-records/pages/NewMedicalRecordPage').then(m => ({ default: m.NewMedicalRecordPage })));

// Billing Pages - lazy loaded
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage').then(m => ({ default: m.BillingPage })));
const InvoiceDetailPage = lazy(() => import('@/features/billing/pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const NewInvoicePage = lazy(() => import('@/features/billing/pages/NewInvoicePage').then(m => ({ default: m.NewInvoicePage })));
const FinancialReportsPage = lazy(() => import('@/features/billing/pages/FinancialReportsPage').then(m => ({ default: m.FinancialReportsPage })));

// Inventory Pages - lazy loaded
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ProductDetailPage = lazy(() => import('@/features/inventory/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const NewProductPage = lazy(() => import('@/features/inventory/pages/NewProductPage').then(m => ({ default: m.NewProductPage })));
const MovementsPage = lazy(() => import('@/features/inventory/pages/MovementsPage').then(m => ({ default: m.MovementsPage })));

// Reports Pages - lazy loaded
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const AppointmentsReportPage = lazy(() => import('@/features/reports/pages/AppointmentsReportPage').then(m => ({ default: m.AppointmentsReportPage })));
const PatientsReportPage = lazy(() => import('@/features/reports/pages/PatientsReportPage').then(m => ({ default: m.PatientsReportPage })));
const RevenueReportPage = lazy(() => import('@/features/reports/pages/RevenueReportPage').then(m => ({ default: m.RevenueReportPage })));
const ProductivityReportPage = lazy(() => import('@/features/reports/pages/ProductivityReportPage').then(m => ({ default: m.ProductivityReportPage })));

// Settings Pages - lazy loaded
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProfileSettingsPage = lazy(() => import('@/features/settings/pages/ProfileSettingsPage').then(m => ({ default: m.ProfileSettingsPage })));
const SecuritySettingsPage = lazy(() => import('@/features/settings/pages/SecuritySettingsPage').then(m => ({ default: m.SecuritySettingsPage })));
const NotificationSettingsPage = lazy(() => import('@/features/settings/pages/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })));
const ClinicSettingsPage = lazy(() => import('@/features/settings/pages/ClinicSettingsPage').then(m => ({ default: m.ClinicSettingsPage })));
const TeamSettingsPage = lazy(() => import('@/features/settings/pages/TeamSettingsPage').then(m => ({ default: m.TeamSettingsPage })));
const SystemSettingsPage = lazy(() => import('@/features/settings/pages/SystemSettingsPage').then(m => ({ default: m.SystemSettingsPage })));
const IntegrationsSettingsPage = lazy(() => import('@/features/settings/pages/IntegrationsSettingsPage').then(m => ({ default: m.IntegrationsSettingsPage })));
const ExportSettingsPage = lazy(() => import('@/features/settings/pages/ExportSettingsPage').then(m => ({ default: m.ExportSettingsPage })));

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Patients Routes */}
          <Route
            path="/patients"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientsPage />
              </Suspense>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientDetailPage />
              </Suspense>
            }
          />

          {/* Appointments Routes */}
          <Route
            path="/appointments"
            element={
              <Suspense fallback={<PageLoader />}>
                <AppointmentsPage />
              </Suspense>
            }
          />

          {/* Medical Records Routes */}
          <Route
            path="/medical-records"
            element={
              <Suspense fallback={<PageLoader />}>
                <MedicalRecordsPage />
              </Suspense>
            }
          />
          <Route
            path="/medical-records/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewMedicalRecordPage />
              </Suspense>
            }
          />
          <Route
            path="/medical-records/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <MedicalRecordDetailPage />
              </Suspense>
            }
          />

          {/* Billing Routes */}
          <Route
            path="/billing"
            element={
              <Suspense fallback={<PageLoader />}>
                <BillingPage />
              </Suspense>
            }
          />
          <Route
            path="/billing/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewInvoicePage />
              </Suspense>
            }
          />
          <Route
            path="/billing/reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <FinancialReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/billing/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceDetailPage />
              </Suspense>
            }
          />

          {/* Inventory Routes */}
          <Route
            path="/inventory"
            element={
              <Suspense fallback={<PageLoader />}>
                <InventoryPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewProductPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory/movements"
            element={
              <Suspense fallback={<PageLoader />}>
                <MovementsPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductDetailPage />
              </Suspense>
            }
          />

          {/* Reports Routes */}
          <Route
            path="/reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/reports/appointments"
            element={
              <Suspense fallback={<PageLoader />}>
                <AppointmentsReportPage />
              </Suspense>
            }
          />
          <Route
            path="/reports/patients"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientsReportPage />
              </Suspense>
            }
          />
          <Route
            path="/reports/revenue"
            element={
              <Suspense fallback={<PageLoader />}>
                <RevenueReportPage />
              </Suspense>
            }
          />
          <Route
            path="/reports/productivity"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductivityReportPage />
              </Suspense>
            }
          />

          {/* Settings Routes */}
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfileSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/security"
            element={
              <Suspense fallback={<PageLoader />}>
                <SecuritySettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/clinic"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClinicSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/team"
            element={
              <Suspense fallback={<PageLoader />}>
                <TeamSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/system"
            element={
              <Suspense fallback={<PageLoader />}>
                <SystemSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/integrations"
            element={
              <Suspense fallback={<PageLoader />}>
                <IntegrationsSettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/export"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExportSettingsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
