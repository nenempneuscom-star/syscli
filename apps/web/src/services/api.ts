// API Service - Now using Supabase directly
// This file provides backwards compatibility with existing code

import {
  patientsService,
  appointmentsService,
  medicalRecordsService,
  billingService,
  inventoryService,
  dashboardService,
  usersService,
  authService,
} from '@/lib/database';

// Export all services
export {
  patientsService,
  appointmentsService,
  medicalRecordsService,
  billingService,
  inventoryService,
  dashboardService,
  usersService,
  authService,
};

// Backwards compatible API object that mimics axios-style calls
// This allows gradual migration of existing code
export const api = {
  // GET requests
  get: async (url: string, config?: { params?: Record<string, any> }) => {
    const params = config?.params || {};

    // Route to appropriate service based on URL
    if (url === '/patients' || url.startsWith('/patients')) {
      if (url === '/patients') {
        const data = await patientsService.getAll(params);
        return { data };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await patientsService.getById(id);
        return { data: { data } };
      }
    }

    if (url === '/appointments' || url.startsWith('/appointments')) {
      if (url === '/appointments') {
        const data = await appointmentsService.getAll(params);
        return { data };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await appointmentsService.getById(id);
        return { data: { data } };
      }
    }

    if (url === '/medical-records' || url.startsWith('/medical-records')) {
      if (url === '/medical-records') {
        const data = await medicalRecordsService.getAll(params);
        return { data };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await medicalRecordsService.getById(id);
        return { data: { data } };
      }
    }

    if (url === '/billing' || url.startsWith('/billing')) {
      if (url === '/billing') {
        const data = await billingService.getAll(params);
        return { data };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await billingService.getById(id);
        return { data: { data } };
      }
    }

    if (url === '/inventory' || url.startsWith('/inventory')) {
      if (url === '/inventory') {
        const data = await inventoryService.getAll(params);
        return { data };
      }
      if (url === '/inventory/movements') {
        const data = await inventoryService.getMovements(params.productId);
        return { data: { data } };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await inventoryService.getById(id);
        return { data: { data } };
      }
    }

    if (url === '/dashboard/metrics') {
      const data = await dashboardService.getMetrics();
      return { data: { data } };
    }

    if (url === '/dashboard/appointments/today') {
      const data = await dashboardService.getTodayAppointments();
      return { data: { data } };
    }

    if (url === '/users' || url.startsWith('/users')) {
      if (url === '/users') {
        const data = await usersService.getAll();
        return { data: { data } };
      }
      if (url === '/users/professionals') {
        const data = await usersService.getProfessionals();
        return { data: { data } };
      }
      const id = url.split('/')[2];
      if (id) {
        const data = await usersService.getById(id);
        return { data: { data } };
      }
    }

    // Default: return empty
    console.warn(`API route not implemented: GET ${url}`);
    return { data: { data: null } };
  },

  // POST requests
  post: async (url: string, body?: any) => {
    if (url === '/patients') {
      const data = await patientsService.create(body);
      return { data: { data } };
    }

    if (url === '/appointments') {
      const data = await appointmentsService.create(body);
      return { data: { data } };
    }

    if (url === '/medical-records') {
      const data = await medicalRecordsService.create(body);
      return { data: { data } };
    }

    if (url === '/billing') {
      const data = await billingService.create(body);
      return { data: { data } };
    }

    if (url === '/inventory') {
      const data = await inventoryService.create(body);
      return { data: { data } };
    }

    if (url === '/inventory/movements') {
      const data = await inventoryService.createMovement(body);
      return { data: { data } };
    }

    if (url === '/auth/login') {
      const data = await authService.signIn(body.email, body.password);
      return { data: { data } };
    }

    console.warn(`API route not implemented: POST ${url}`);
    return { data: { data: null } };
  },

  // PUT requests
  put: async (url: string, body?: any) => {
    const parts = url.split('/');
    const resource = parts[1];
    const id = parts[2];

    if (resource === 'patients' && id) {
      const data = await patientsService.update(id, body);
      return { data: { data } };
    }

    if (resource === 'appointments' && id) {
      const data = await appointmentsService.update(id, body);
      return { data: { data } };
    }

    if (resource === 'medical-records' && id) {
      const data = await medicalRecordsService.update(id, body);
      return { data: { data } };
    }

    if (resource === 'inventory' && id) {
      const data = await inventoryService.update(id, body);
      return { data: { data } };
    }

    console.warn(`API route not implemented: PUT ${url}`);
    return { data: { data: null } };
  },

  // PATCH requests
  patch: async (url: string, body?: any) => {
    const parts = url.split('/');
    const resource = parts[1];
    const id = parts[2];
    const action = parts[3];

    if (resource === 'appointments' && id && action === 'status') {
      const data = await appointmentsService.updateStatus(id, body.status);
      return { data: { data } };
    }

    if (resource === 'billing' && id && action === 'status') {
      const data = await billingService.updateStatus(id, body.status, body.paymentMethod);
      return { data: { data } };
    }

    // Default to PUT behavior
    return api.put(url, body);
  },

  // DELETE requests
  delete: async (url: string) => {
    const parts = url.split('/');
    const resource = parts[1];
    const id = parts[2];

    if (resource === 'patients' && id) {
      await patientsService.delete(id);
      return { data: { success: true } };
    }

    console.warn(`API route not implemented: DELETE ${url}`);
    return { data: { success: false } };
  },
};

export default api;
