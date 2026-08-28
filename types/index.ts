// Tipe Data Lengkap untuk Asset Management System

export type UUID = string;

export type UserRole = 'super-admin' | 'asset-manager' | 'auditor' | 'maintenance' | 'viewer';

export interface User {
  id: UUID;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  location: string;
  avatarUrl?: string;
  userId?: string; // ID Pengguna unik untuk login
  idCard?: string; // Nomor ID Card Pegawai / NIK
  birthDate?: string; // Tanggal Lahir (YYYY-MM-DD)
  theme?: 'light' | 'dark' | 'system';
  language?: 'id' | 'en';
  password?: string; // Hashed / plain stored credential
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export type Permission =
  | 'settings.manage'
  | 'settings.company_identity'
  | 'settings.asset_format'
  | 'system.wizard_setup'
  | 'users.manage'
  | 'roles.manage'
  | 'permissions.manage'
  | 'assets.view'
  | 'assets.view_all'
  | 'assets.manage'
  | 'movements.manage'
  | 'disposals.manage'
  | 'audits.manage'
  | 'maintenance.manage'
  | 'reports.view'
  | 'approvals.manage'
  | 'approvals.process';

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
}

export type AssetStatus = 'ACTIVE' | 'IN_USE' | 'MAINTENANCE' | 'DISPOSED' | 'MISSING' | 'RESERVED';
export type AssetCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export interface AssetCategory {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  iconName?: string;
  depreciationPeriodYears: number;
  salvagePercentage?: number;
  depreciationMethod?: string;
}

export interface AssetLocation {
  id: UUID;
  code: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  city: string;
  address?: string;
}

export interface AssetClass {
  id: UUID;
  code: string;
  name: string;
  description?: string;
}

export interface Asset {
  id: UUID;
  assetCode: string;
  serialNumber: string;
  name: string;
  categoryId: UUID;
  categoryName: string;
  locationId: UUID;
  locationName: string;
  department: string;
  picName: string;
  picEmail: string;
  status: AssetStatus;
  condition: AssetCondition;
  purchaseDate: string;
  purchaseCost: number;
  residualValue: number;
  usefulLifeYears: number;
  currentBookValue: number;
  warrantyExpiryDate?: string;
  imageUrl?: string;
  notes?: string;
  rfidTag?: string;
  nfcTag?: string;
  qrPayload?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalType = 'MOVEMENT' | 'DISPOSAL' | 'MAINTENANCE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApprovalRequest {
  id: UUID;
  type: ApprovalType;
  assetId: UUID;
  assetCode: string;
  assetName: string;
  requesterId: UUID;
  requesterName: string;
  requesterRole: string;
  status: ApprovalStatus;
  details: {
    previousState?: Partial<Asset>;
    targetState?: Partial<Asset>;
    reason: string;
    estimatedCost?: number;
    disposalMethod?: 'SOLD' | 'SCRAPPED' | 'DONATED' | 'LOST' | 'RECYCLED';
    saleAmount?: number;
    maintenanceVendor?: string;
  };
  approverId?: UUID;
  approverName?: string;
  approverNotes?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  decidedAt?: string;
}

export interface MovementRecord {
  id: UUID;
  assetId: UUID;
  assetCode: string;
  assetName: string;
  fromLocationId: UUID;
  fromLocationName: string;
  toLocationId: UUID;
  toLocationName: string;
  fromDepartment: string;
  toDepartment: string;
  fromPic: string;
  toPic: string;
  movementDate: string;
  reason: string;
  performedBy: string;
  approvalRequestId?: UUID;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
}

export interface DisposalRecord {
  id: UUID;
  assetId: UUID;
  assetCode: string;
  assetName: string;
  disposalDate: string;
  method: 'SOLD' | 'SCRAPPED' | 'DONATED' | 'LOST' | 'RECYCLED';
  salePrice?: number;
  disposalReason: string;
  recipientOrVendor?: string;
  approvedBy: string;
  isReversed?: boolean;
  reverseReason?: string;
}

export type MaintenanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION' | 'UPGRADE';

export interface MaintenanceRecord {
  id: UUID;
  assetId: UUID;
  assetCode: string;
  assetName: string;
  maintenanceType: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: string;
  completionDate?: string;
  description: string;
  technicianName: string;
  vendorName?: string;
  cost: number;
  partsReplaced?: string;
  downtimeHours?: number;
  notes?: string;
}

export type AuditItemStatus = 'MATCHED' | 'MISSING' | 'DAMAGED' | 'UNEXPECTED_LOCATION';

export interface AuditCampaign {
  id: UUID;
  title: string;
  targetLocationId?: UUID;
  targetLocationName?: string;
  targetCategoryId?: UUID;
  targetCategoryName?: string;
  startDate: string;
  endDate?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  auditorName: string;
  totalExpected: number;
  totalAudited: number;
  matchedCount: number;
  missingCount: number;
  damagedCount: number;
  unexpectedCount: number;
}

export interface AuditItemRecord {
  id: UUID;
  campaignId: UUID;
  assetId: UUID;
  assetCode: string;
  assetName: string;
  expectedLocation: string;
  scannedLocation: string;
  status: AuditItemStatus;
  scannedAt: string;
  scannedBy: string;
  notes?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  group: 'APPLICATION' | 'ASSET' | 'WORKFLOW' | 'SECURITY' | 'NOTIFICATION' | 'INTEGRATION' | 'MAINTENANCE';
  label: string;
  description: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'SELECT';
  options?: string[];
}

export interface ActivityLog {
  id: UUID;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'ASSET' | 'MOVEMENT' | 'DISPOSAL' | 'MAINTENANCE' | 'AUDIT' | 'APPROVAL' | 'SETTING' | 'AUTH' | 'SETTINGS' | 'SECURITY';
  entityId?: string;
  details: string;
  description?: string;
  module?: string;
  ipAddress: string;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AppNotification {
  id: UUID;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  link?: string;
  createdAt: string;
  isRead: boolean;
}

export type SystemNotification = AppNotification;

export type NotificationEventType =
  | 'asset.created'
  | 'asset.updated'
  | 'asset.movement'
  | 'asset.maintenance'
  | 'asset.disposal'
  | 'asset.disposed'
  | 'maintenance.due'
  | 'maintenance.completed'
  | 'approval.requested'
  | 'approval.decided'
  | 'approval.approved'
  | 'approval.rejected'
  | 'audit.stocktake'
  | 'audit.discrepancy';

export interface DiscordConfig {
  enabled: boolean;
  webhookUrl: string;
  botName: string;
  events: NotificationEventType[];
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  events: NotificationEventType[];
}

export interface WhatsAppConfig {
  enabled: boolean;
  gatewayType: 'FONNTE' | 'WAHA' | 'ULTRAMSG' | 'CUSTOM_GATEWAY';
  endpointUrl: string;
  apiKey: string;
  recipientNumber: string;
  events: NotificationEventType[];
}

export interface CustomWebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  secretToken: string;
  customHeaders: Record<string, string>;
  events: NotificationEventType[];
}

export interface NotificationIntegrationsConfig {
  apiKey: string;
  discord: DiscordConfig;
  telegram: TelegramConfig;
  whatsapp: WhatsAppConfig;
  customWebhook: CustomWebhookConfig;
}

export interface WebhookDispatchLog {
  id: string;
  timestamp: string;
  channel: 'DISCORD' | 'TELEGRAM' | 'WHATSAPP' | 'CUSTOM_WEBHOOK';
  event: NotificationEventType;
  title: string;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  httpStatus?: number;
  requestPayload: any;
  responseMessage?: string;
  durationMs: number;
}
