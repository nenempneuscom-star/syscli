// Supabase Database Services
// Replace API calls with direct Supabase queries

import { supabase } from './supabase';

// ============================================
// Types
// ============================================

export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Helper to get current user's tenant
// ============================================

export async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's tenant from the users table
  const { data } = await supabase
    .from('User')
    .select('tenantId')
    .eq('id', user.id)
    .single();

  return data?.tenantId || null;
}

// ============================================
// PATIENTS
// ============================================

export const patientsService = {
  async getAll(params: PaginationParams = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, perPage = 20, search } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('Patient')
      .select('*, _count:Appointment(count), _records:MedicalRecord(count)', { count: 'exact' });

    if (search) {
      query = query.or(`fullName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      meta: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('Patient')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(patient: any) {
    const tenantId = await getCurrentTenantId();
    const { data, error } = await supabase
      .from('Patient')
      .insert({ ...patient, tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, patient: any) {
    const { data, error } = await supabase
      .from('Patient')
      .update(patient)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('Patient')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// APPOINTMENTS
// ============================================

export const appointmentsService = {
  async getAll(params: PaginationParams & { status?: string; professionalId?: string; date?: string } = {}) {
    const { page = 1, perPage = 20, status, professionalId, date } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('Appointment')
      .select(`
        *,
        patient:Patient(id, fullName, phone),
        professional:User(id, name)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (professionalId) query = query.eq('professionalId', professionalId);
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.gte('startTime', startOfDay.toISOString()).lte('startTime', endOfDay.toISOString());
    }

    const { data, error, count } = await query
      .order('startTime', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      meta: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        patient:Patient(*),
        professional:User(id, name, professionalId, specialties)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(appointment: any) {
    const tenantId = await getCurrentTenantId();
    const { data, error } = await supabase
      .from('Appointment')
      .insert({ ...appointment, tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, appointment: any) {
    const { data, error } = await supabase
      .from('Appointment')
      .update(appointment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const updates: any = { status };

    if (status === 'CONFIRMED') updates.confirmedAt = new Date().toISOString();
    if (status === 'WAITING') updates.checkedInAt = new Date().toISOString();
    if (status === 'IN_PROGRESS') updates.startedAt = new Date().toISOString();
    if (status === 'COMPLETED') updates.completedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('Appointment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// MEDICAL RECORDS
// ============================================

export const medicalRecordsService = {
  async getAll(params: PaginationParams & { patientId?: string; type?: string } = {}) {
    const { page = 1, perPage = 20, patientId, type } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('MedicalRecord')
      .select(`
        *,
        patient:Patient(id, fullName),
        professional:User(id, name, professionalId)
      `, { count: 'exact' });

    if (patientId) query = query.eq('patientId', patientId);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      meta: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('MedicalRecord')
      .select(`
        *,
        patient:Patient(*),
        professional:User(id, name, professionalId, specialties)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(record: any) {
    const tenantId = await getCurrentTenantId();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('MedicalRecord')
      .insert({
        ...record,
        tenantId,
        professionalId: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, record: any) {
    const { data, error } = await supabase
      .from('MedicalRecord')
      .update({ ...record, version: supabase.rpc('increment_version') })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// INVOICES / BILLING
// ============================================

export const billingService = {
  async getAll(params: PaginationParams & { status?: string; patientId?: string } = {}) {
    const { page = 1, perPage = 20, status, patientId } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('Invoice')
      .select(`
        *,
        patient:Patient(id, fullName, phone, email)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (patientId) query = query.eq('patientId', patientId);

    const { data, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      meta: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('Invoice')
      .select(`
        *,
        patient:Patient(*),
        appointment:Appointment(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(invoice: any) {
    const tenantId = await getCurrentTenantId();

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const { count } = await supabase
      .from('Invoice')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', `${year}-${month}-01`);

    const invoiceNumber = `${year}${month}-${String((count || 0) + 1).padStart(5, '0')}`;

    const { data, error } = await supabase
      .from('Invoice')
      .insert({
        ...invoice,
        tenantId,
        invoiceNumber,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string, paymentMethod?: string) {
    const updates: any = { status };
    if (status === 'PAID') {
      updates.paidAt = new Date().toISOString();
      if (paymentMethod) updates.paymentMethod = paymentMethod;
    }

    const { data, error } = await supabase
      .from('Invoice')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// INVENTORY
// ============================================

export const inventoryService = {
  async getAll(params: PaginationParams & { category?: string; lowStock?: boolean } = {}) {
    const { page = 1, perPage = 20, category, lowStock } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('InventoryItem')
      .select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (lowStock) query = query.lte('currentStock', supabase.rpc('get_min_stock'));

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      meta: {
        page,
        perPage,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / perPage),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('InventoryItem')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(item: any) {
    const tenantId = await getCurrentTenantId();
    const { data, error } = await supabase
      .from('InventoryItem')
      .insert({ ...item, tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, item: any) {
    const { data, error } = await supabase
      .from('InventoryItem')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMovements(productId?: string) {
    let query = supabase
      .from('InventoryMovement')
      .select(`
        *,
        product:InventoryItem(id, name),
        user:User(id, name)
      `)
      .order('createdAt', { ascending: false })
      .limit(100);

    if (productId) query = query.eq('productId', productId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createMovement(movement: any) {
    const tenantId = await getCurrentTenantId();
    const { data: { user } } = await supabase.auth.getUser();

    // Get current stock
    const { data: item } = await supabase
      .from('InventoryItem')
      .select('currentStock')
      .eq('id', movement.productId)
      .single();

    const previousStock = item?.currentStock || 0;
    const newStock = movement.type === 'IN'
      ? previousStock + movement.quantity
      : previousStock - movement.quantity;

    // Create movement
    const { data, error } = await supabase
      .from('InventoryMovement')
      .insert({
        ...movement,
        tenantId,
        userId: user?.id,
        previousStock,
        newStock,
      })
      .select()
      .single();

    if (error) throw error;

    // Update item stock
    await supabase
      .from('InventoryItem')
      .update({ currentStock: newStock })
      .eq('id', movement.productId);

    return data;
  },
};

// ============================================
// DASHBOARD / REPORTS
// ============================================

export const dashboardService = {
  async getMetrics() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      { count: totalPatients },
      { count: newPatients },
      { count: todayAppointments },
      { count: completedAppointments },
      { data: pendingInvoices },
      { data: paidInvoices },
      { count: lowStockItems },
    ] = await Promise.all([
      supabase.from('Patient').select('*', { count: 'exact', head: true }),
      supabase.from('Patient').select('*', { count: 'exact', head: true })
        .gte('createdAt', startOfMonth.toISOString()),
      supabase.from('Appointment').select('*', { count: 'exact', head: true })
        .gte('startTime', today.toISOString().split('T')[0])
        .lt('startTime', new Date(today.getTime() + 86400000).toISOString().split('T')[0]),
      supabase.from('Appointment').select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('completedAt', startOfMonth.toISOString()),
      supabase.from('Invoice').select('total')
        .eq('status', 'PENDING'),
      supabase.from('Invoice').select('total')
        .eq('status', 'PAID')
        .gte('paidAt', startOfMonth.toISOString()),
      supabase.from('InventoryItem').select('*', { count: 'exact', head: true })
        .lte('currentStock', 10), // simplified low stock check
    ]);

    const pendingRevenue = pendingInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
    const receivedRevenue = paidInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

    return {
      patients: {
        total: totalPatients || 0,
        newThisMonth: newPatients || 0,
      },
      appointments: {
        today: todayAppointments || 0,
        completedThisMonth: completedAppointments || 0,
      },
      revenue: {
        pending: pendingRevenue,
        received: receivedRevenue,
        total: pendingRevenue + receivedRevenue,
      },
      inventory: {
        lowStock: lowStockItems || 0,
      },
    };
  },

  async getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('Appointment')
      .select(`
        *,
        patient:Patient(id, fullName, phone),
        professional:User(id, name)
      `)
      .gte('startTime', today)
      .lt('startTime', tomorrow)
      .order('startTime', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// ============================================
// USERS / TEAM
// ============================================

export const usersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getProfessionals() {
    const { data, error } = await supabase
      .from('User')
      .select('id, name, professionalId, specialties, role')
      .in('role', ['DOCTOR', 'NURSE'])
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// AUTH
// ============================================

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user details from our User table
    if (data.user) {
      const { data: userData } = await supabase
        .from('User')
        .select('*, tenant:Tenant(id, name, subdomain)')
        .eq('email', email)
        .single();

      return {
        user: userData,
        session: data.session,
      };
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('User')
      .select('*, tenant:Tenant(id, name, subdomain)')
      .eq('id', user.id)
      .single();

    return data;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
