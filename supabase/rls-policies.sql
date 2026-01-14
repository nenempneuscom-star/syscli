-- =====================================================
-- HealthFlow - Row Level Security (RLS) Policies
-- Supabase Multi-tenant Security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MedicalRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function to get current user's tenant ID
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT "tenantId"::UUID
    FROM "User"
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role::text
    FROM "User"
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'SUPER_ADMIN'
    FROM "User"
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PLAN policies (read-only for all, manage for super admin)
-- =====================================================
CREATE POLICY "Plans are viewable by authenticated users"
  ON "Plan" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Plans are manageable by super admins"
  ON "Plan" FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- =====================================================
-- TENANT policies
-- =====================================================
CREATE POLICY "Tenants can view their own tenant"
  ON "Tenant" FOR SELECT
  TO authenticated
  USING (
    id::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Super admins can manage tenants"
  ON "Tenant" FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- =====================================================
-- USER policies (tenant isolation)
-- =====================================================
CREATE POLICY "Users can view users in their tenant"
  ON "User" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Tenant admins can manage users in their tenant"
  ON "User" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
    AND (
      get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant admins can update users in their tenant"
  ON "User" FOR UPDATE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND (
      get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
      OR id = auth.uid()::text -- Users can update themselves
    )
  )
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

CREATE POLICY "Tenant admins can delete users in their tenant"
  ON "User" FOR DELETE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    AND id != auth.uid()::text -- Cannot delete yourself
  );

-- =====================================================
-- PATIENT policies (tenant isolation)
-- =====================================================
CREATE POLICY "Users can view patients in their tenant"
  ON "Patient" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Users can create patients in their tenant"
  ON "Patient" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

CREATE POLICY "Users can update patients in their tenant"
  ON "Patient" FOR UPDATE
  TO authenticated
  USING ("tenantId"::text = get_current_tenant_id()::text)
  WITH CHECK ("tenantId"::text = get_current_tenant_id()::text);

CREATE POLICY "Admins can delete patients in their tenant"
  ON "Patient" FOR DELETE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
  );

-- =====================================================
-- MEDICAL RECORD policies (tenant isolation + role-based)
-- =====================================================
CREATE POLICY "Healthcare professionals can view medical records in their tenant"
  ON "MedicalRecord" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('DOCTOR', 'NURSE', 'TENANT_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "Healthcare professionals can create medical records"
  ON "MedicalRecord" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('DOCTOR', 'NURSE')
  );

CREATE POLICY "Healthcare professionals can update their own records"
  ON "MedicalRecord" FOR UPDATE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND (
      "professionalId" = auth.uid()::text
      OR get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
    )
  )
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

-- No delete policy for medical records (audit requirement)
-- Records should be soft-deleted or archived instead

-- =====================================================
-- ROOM policies (tenant isolation)
-- =====================================================
CREATE POLICY "Users can view rooms in their tenant"
  ON "Room" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Admins can manage rooms in their tenant"
  ON "Room" FOR ALL
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
  )
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

-- =====================================================
-- APPOINTMENT policies (tenant isolation)
-- =====================================================
CREATE POLICY "Users can view appointments in their tenant"
  ON "Appointment" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Staff can create appointments in their tenant"
  ON "Appointment" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('RECEPTIONIST', 'DOCTOR', 'NURSE', 'TENANT_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "Staff can update appointments in their tenant"
  ON "Appointment" FOR UPDATE
  TO authenticated
  USING ("tenantId"::text = get_current_tenant_id()::text)
  WITH CHECK ("tenantId"::text = get_current_tenant_id()::text);

CREATE POLICY "Admins can delete appointments in their tenant"
  ON "Appointment" FOR DELETE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
  );

-- =====================================================
-- INVOICE policies (tenant isolation)
-- =====================================================
CREATE POLICY "Finance staff can view invoices in their tenant"
  ON "Invoice" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('BILLING_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST')
  );

CREATE POLICY "Finance staff can create invoices"
  ON "Invoice" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('BILLING_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST')
  );

CREATE POLICY "Finance staff can update invoices"
  ON "Invoice" FOR UPDATE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('BILLING_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')
  )
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

-- No delete policy for invoices (financial audit requirement)

-- =====================================================
-- INVENTORY ITEM policies (tenant isolation)
-- =====================================================
CREATE POLICY "Staff can view inventory in their tenant"
  ON "InventoryItem" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Staff can manage inventory in their tenant"
  ON "InventoryItem" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

CREATE POLICY "Staff can update inventory in their tenant"
  ON "InventoryItem" FOR UPDATE
  TO authenticated
  USING ("tenantId"::text = get_current_tenant_id()::text)
  WITH CHECK ("tenantId"::text = get_current_tenant_id()::text);

CREATE POLICY "Admins can delete inventory in their tenant"
  ON "InventoryItem" FOR DELETE
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
  );

-- =====================================================
-- INVENTORY MOVEMENT policies (tenant isolation)
-- =====================================================
CREATE POLICY "Staff can view inventory movements in their tenant"
  ON "InventoryMovement" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    OR is_super_admin()
  );

CREATE POLICY "Staff can create inventory movements"
  ON "InventoryMovement" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

-- No update or delete for movements (audit trail)

-- =====================================================
-- AUDIT LOG policies (read-only for admins)
-- =====================================================
CREATE POLICY "Admins can view audit logs in their tenant"
  ON "AuditLog" FOR SELECT
  TO authenticated
  USING (
    "tenantId"::text = get_current_tenant_id()::text
    AND get_current_user_role() IN ('TENANT_ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "System can insert audit logs"
  ON "AuditLog" FOR INSERT
  TO authenticated
  WITH CHECK (
    "tenantId"::text = get_current_tenant_id()::text
  );

-- No update or delete for audit logs (immutable)

-- =====================================================
-- Grant service role full access (for backend operations)
-- =====================================================
-- Note: Service role bypasses RLS by default in Supabase
-- This is used for administrative operations and migrations

-- =====================================================
-- Index recommendations for RLS performance
-- =====================================================
-- CREATE INDEX IF NOT EXISTS idx_user_tenant_id ON "User"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_patient_tenant_id ON "Patient"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_medical_record_tenant_id ON "MedicalRecord"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_appointment_tenant_id ON "Appointment"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_invoice_tenant_id ON "Invoice"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_inventory_item_tenant_id ON "InventoryItem"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_inventory_movement_tenant_id ON "InventoryMovement"("tenantId");
-- CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON "AuditLog"("tenantId");
