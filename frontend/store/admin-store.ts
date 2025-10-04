// frontend/store/admin-store.ts
import { create } from 'zustand';
import { 
  PlatformMetrics, 
  SystemHealth, 
  UserManagementFilters,
  ContentModerationQueue,
  FinancialOverview,
  SecurityAlert,
  AuditLog,
  AdminUser,
  PlatformConfig,
  Report
} from '@/types/admin';

interface AdminState {
  // Core State
  platformMetrics: PlatformMetrics | null;
  systemHealth: SystemHealth | null;
  moderationQueue: ContentModerationQueue | null;
  financialOverview: FinancialOverview | null;
  securityAlerts: SecurityAlert[];
  auditLogs: AuditLog[];
  platformConfig: PlatformConfig | null;
  
  // UI State
  isLoading: boolean;
  lastUpdated: Date | null;
  activeModule: 'dashboard' | 'users' | 'content' | 'competitions' | 'financial' | 'security' | 'system' | 'reports';
  
  // Actions - Dashboard
  fetchPlatformMetrics: () => Promise<void>;
  fetchSystemHealth: () => Promise<void>;
  fetchModerationQueue: () => Promise<void>;
  fetchFinancialOverview: () => Promise<void>;
  fetchSecurityAlerts: () => Promise<void>;
  
  // User Management
  fetchUsers: (filters?: UserManagementFilters, page?: number) => Promise<any>;
  updateUserStatus: (userId: string, status: string, reason?: string) => Promise<void>;
  impersonateUser: (userId: string) => Promise<void>;
  exportUserData: (userId: string) => Promise<void>;
  
  // Content Moderation
  fetchModerationQueue: () => Promise<void>;
  moderateContent: (contentId: string, action: string, reason: string) => Promise<void>;
  bulkModerate: (contentIds: string[], action: string, reason: string) => Promise<void>;
  
  // Financial Management
  processWithdrawals: (withdrawalIds: string[]) => Promise<void>;
  reverseTransaction: (transactionId: string, reason: string) => Promise<void>;
  generateFinancialReport: (startDate: Date, endDate: Date) => Promise<Report>;
  
  // System Management
  updatePlatformConfig: (config: Partial<PlatformConfig>) => Promise<void>;
  triggerMaintenance: (enabled: boolean, message?: string) => Promise<void>;
  clearCache: (cacheType?: string) => Promise<void>;
  
  // Security & Compliance
  fetchAuditLogs: (filters?: any) => Promise<void>;
  banUser: (userId: string, reason: string, duration?: number) => Promise<void>;
  investigateAlert: (alertId: string, assignedTo: string) => Promise<void>;
  
  // Real-time Updates
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  platformMetrics: null,
  systemHealth: null,
  moderationQueue: null,
  financialOverview: null,
  securityAlerts: [],
  auditLogs: [],
  platformConfig: null,
  isLoading: false,
  lastUpdated: null,
  activeModule: 'dashboard',

  // Fetch Platform Metrics
  fetchPlatformMetrics: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) throw new Error('Failed to fetch platform metrics');
      
      const metrics = await response.json();
      set({ 
        platformMetrics: metrics,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Fetch System Health
  fetchSystemHealth: async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      if (!response.ok) throw new Error('Failed to fetch system health');
      
      const systemHealth = await response.json();
      set({ systemHealth });
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },

  // Fetch Moderation Queue
  fetchModerationQueue: async () => {
    try {
      const response = await fetch('/api/admin/moderation/queue');
      if (!response.ok) throw new Error('Failed to fetch moderation queue');
      
      const moderationQueue = await response.json();
      set({ moderationQueue });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  },

  // Fetch Financial Overview
  fetchFinancialOverview: async () => {
    try {
      const response = await fetch('/api/admin/financial/overview');
      if (!response.ok) throw new Error('Failed to fetch financial overview');
      
      const financialOverview = await response.json();
      set({ financialOverview });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      throw error;
    }
  },

  // Fetch Security Alerts
  fetchSecurityAlerts: async () => {
    try {
      const response = await fetch('/api/admin/security/alerts');
      if (!response.ok) throw new Error('Failed to fetch security alerts');
      
      const securityAlerts = await response.json();
      set({ securityAlerts });
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      throw error;
    }
  },

  // User Management
  fetchUsers: async (filters: UserManagementFilters = {}, page = 1) => {
    set({ isLoading: true });
    try {
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.kycStatus) queryParams.append('kycStatus', filters.kycStatus);
      queryParams.append('page', page.toString());

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      set({ isLoading: false });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateUserStatus: async (userId: string, status: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  impersonateUser: async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Redirect to user's perspective
      window.location.href = '/';
    } catch (error) {
      console.error('Error impersonating user:', error);
      throw error;
    }
  },

  exportUserData: async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/export`);
      if (!response.ok) throw new Error('Failed to export user data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${userId}-data.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  // Content Moderation
  moderateContent: async (contentId: string, action: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/moderation/content/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Refresh moderation queue
      get().fetchModerationQueue();
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  },

  bulkModerate: async (contentIds: string[], action: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/moderation/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds, action, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Refresh moderation queue
      get().fetchModerationQueue();
    } catch (error) {
      console.error('Error bulk moderating content:', error);
      throw error;
    }
  },

  // Financial Management
  processWithdrawals: async (withdrawalIds: string[]) => {
    try {
      const response = await fetch('/api/admin/financial/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Refresh financial overview
      get().fetchFinancialOverview();
    } catch (error) {
      console.error('Error processing withdrawals:', error);
      throw error;
    }
  },

  reverseTransaction: async (transactionId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/financial/transactions/${transactionId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error reversing transaction:', error);
      throw error;
    }
  },

  generateFinancialReport: async (startDate: Date, endDate: Date): Promise<Report> => {
    try {
      const response = await fetch('/api/admin/reports/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  },

  // System Management
  updatePlatformConfig: async (config: Partial<PlatformConfig>) => {
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const updatedConfig = await response.json();
      set({ platformConfig: updatedConfig });
    } catch (error) {
      console.error('Error updating platform config:', error);
      throw error;
    }
  },

  triggerMaintenance: async (enabled: boolean, message?: string) => {
    try {
      const response = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error triggering maintenance:', error);
      throw error;
    }
  },

  clearCache: async (cacheType?: string) => {
    try {
      const response = await fetch('/api/admin/system/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  },

  // Security & Compliance
  fetchAuditLogs: async (filters: any = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`/api/admin/security/audit-logs?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const auditLogs = await response.json();
      set({ auditLogs });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  banUser: async (userId: string, reason: string, duration?: number) => {
    try {
      const response = await fetch(`/api/admin/security/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, duration }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  },

  investigateAlert: async (alertId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}/investigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Refresh security alerts
      get().fetchSecurityAlerts();
    } catch (error) {
      console.error('Error investigating alert:', error);
      throw error;
    }
  },

  // Real-time Updates
  subscribeToUpdates: () => {
    // WebSocket implementation for real-time admin updates
    console.log('Subscribing to admin real-time updates');
  },

  unsubscribeFromUpdates: () => {
    console.log('Unsubscribing from admin real-time updates');
  },
}));
