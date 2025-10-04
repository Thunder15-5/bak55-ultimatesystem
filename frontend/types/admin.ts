// frontend/types/admin.ts
export interface PlatformMetrics {
  // User Metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: DailyMetric[];
  userGrowth: number;
  
  // Content Metrics
  totalTracks: number;
  totalCompetitions: number;
  totalVotes: number;
  totalPlays: number;
  
  // Financial Metrics
  totalRevenue: number;
  platformFees: number;
  artistPayouts: number;
  revenueGrowth: number;
  
  // Performance Metrics
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
  activeSessions: number;
  
  // AI Metrics
  aiAnalyses: number;
  aiAccuracy: number;
  recommendationEngagement: number;
  fraudPrevented: number;
}

export interface DailyMetric {
  date: string;
  value: number;
  change: number;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  components: SystemComponent[];
  incidents: SystemIncident[];
  lastUpdated: Date;
}

export interface SystemComponent {
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  latency: number;
  uptime: number;
  dependencies: string[];
}

export interface SystemIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  components: string[];
  startedAt: Date;
  resolvedAt?: Date;
  description: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: Date;
  message: string;
  status: string;
}

export interface UserManagementFilters {
  role?: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  dateRange?: { start: Date; end: Date };
  search?: string;
  kycStatus?: KYCStatus;
}

export interface ContentModerationQueue {
  pendingTracks: number;
  pendingCompetitions: number;
  flaggedContent: number;
  appeals: number;
}

export interface ModerationAction {
  id: string;
  contentId: string;
  contentType: 'TRACK' | 'COMPETITION' | 'USER' | 'COMMENT';
  action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'DELETE';
  reason: string;
  moderatorId: string;
  timestamp: Date;
  notes?: string;
}

export interface FinancialOverview {
  totalBalance: number;
  pendingWithdrawals: number;
  platformRevenue: number;
  transactionVolume: number;
  feeRevenue: number;
  dailyTransactions: DailyTransaction[];
}

export interface DailyTransaction {
  date: string;
  deposits: number;
  withdrawals: number;
  tips: number;
  prizes: number;
  fees: number;
}

export interface SecurityAlert {
  id: string;
  type: 'FRAUD' | 'SUSPICIOUS_ACTIVITY' | 'SECURITY_BREACH' | 'COMPLIANCE_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedUsers: number;
  detectedAt: Date;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED';
  assignedTo?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  lastActive: Date;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export interface PlatformConfig {
  // General Settings
  platformName: string;
  platformCurrency: string;
  maintenanceMode: boolean;
  
  // Financial Settings
  platformFee: number;
  withdrawalFee: number;
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  
  // Competition Settings
  defaultJudgeWeight: number;
  defaultFanWeight: number;
  maximumPrizePool: number;
  competitionEntryFee: number;
  
  // AI Settings
  aiAnalysisEnabled: boolean;
  talentScoringEnabled: boolean;
  recommendationEnabled: boolean;
  fraudDetectionEnabled: boolean;
  
  // Security Settings
  requireKYC: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT'
}

export interface Report {
  id: string;
  type: 'USER' | 'CONTENT' | 'COMPETITION' | 'FINANCIAL' | 'SECURITY';
  title: string;
  description: string;
  generatedBy: string;
  generatedAt: Date;
  data: any;
  format: 'PDF' | 'CSV' | 'JSON';
  status: 'GENERATING' | 'READY' | 'FAILED';
  downloadUrl?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'METRIC' | 'CHART' | 'TABLE' | 'LIST';
  data: any;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  position: number;
  refreshInterval: number;
}
