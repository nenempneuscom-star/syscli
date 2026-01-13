import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/features/auth/store/auth-store';

// Layouts
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';

// Dashboard Pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PatientsPage } from '@/features/patients/pages/PatientsPage';
import { PatientDetailPage } from '@/features/patients/pages/PatientDetailPage';
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage';
import { MedicalRecordsPage } from '@/features/medical-records/pages/MedicalRecordsPage';
import { MedicalRecordDetailPage } from '@/features/medical-records/pages/MedicalRecordDetailPage';
import { NewMedicalRecordPage } from '@/features/medical-records/pages/NewMedicalRecordPage';

// Billing Pages
import { BillingPage } from '@/features/billing/pages/BillingPage';
import { InvoiceDetailPage } from '@/features/billing/pages/InvoiceDetailPage';
import { NewInvoicePage } from '@/features/billing/pages/NewInvoicePage';
import { FinancialReportsPage } from '@/features/billing/pages/FinancialReportsPage';

// Inventory Pages
import { InventoryPage } from '@/features/inventory/pages/InventoryPage';
import { ProductDetailPage } from '@/features/inventory/pages/ProductDetailPage';
import { NewProductPage } from '@/features/inventory/pages/NewProductPage';
import { MovementsPage } from '@/features/inventory/pages/MovementsPage';

// Reports Pages
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { AppointmentsReportPage } from '@/features/reports/pages/AppointmentsReportPage';
import { PatientsReportPage } from '@/features/reports/pages/PatientsReportPage';
import { RevenueReportPage } from '@/features/reports/pages/RevenueReportPage';
import { ProductivityReportPage } from '@/features/reports/pages/ProductivityReportPage';

// Settings Pages
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { ProfileSettingsPage } from '@/features/settings/pages/ProfileSettingsPage';
import { SecuritySettingsPage } from '@/features/settings/pages/SecuritySettingsPage';
import { NotificationSettingsPage } from '@/features/settings/pages/NotificationSettingsPage';
import { ClinicSettingsPage } from '@/features/settings/pages/ClinicSettingsPage';
import { TeamSettingsPage } from '@/features/settings/pages/TeamSettingsPage';
import { SystemSettingsPage } from '@/features/settings/pages/SystemSettingsPage';
import { IntegrationsSettingsPage } from '@/features/settings/pages/IntegrationsSettingsPage';
import { ExportSettingsPage } from '@/features/settings/pages/ExportSettingsPage';

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
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
          <Route path="/medical-records/new" element={<NewMedicalRecordPage />} />
          <Route path="/medical-records/:id" element={<MedicalRecordDetailPage />} />

          {/* Billing Routes */}
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/new" element={<NewInvoicePage />} />
          <Route path="/billing/reports" element={<FinancialReportsPage />} />
          <Route path="/billing/:id" element={<InvoiceDetailPage />} />

          {/* Inventory Routes */}
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/new" element={<NewProductPage />} />
          <Route path="/inventory/movements" element={<MovementsPage />} />
          <Route path="/inventory/:id" element={<ProductDetailPage />} />

          {/* Reports Routes */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/appointments" element={<AppointmentsReportPage />} />
          <Route path="/reports/patients" element={<PatientsReportPage />} />
          <Route path="/reports/revenue" element={<RevenueReportPage />} />
          <Route path="/reports/productivity" element={<ProductivityReportPage />} />

          {/* Settings Routes */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<ProfileSettingsPage />} />
          <Route path="/settings/security" element={<SecuritySettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="/settings/clinic" element={<ClinicSettingsPage />} />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route path="/settings/system" element={<SystemSettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
          <Route path="/settings/export" element={<ExportSettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
