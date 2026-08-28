import { StorageService } from './storageService';
import { ActivityLog } from '../types';

export function maskSensitiveData(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/(["']?password["']?\s*[:=]\s*["'])(.*?)(["'])/gi, '$1***MASKED***$3')
    .replace(/(["']?token["']?\s*[:=]\s*["'])(.*?)(["'])/gi, '$1***MASKED***$3')
    .replace(/(["']?secret["']?\s*[:=]\s*["'])(.*?)(["'])/gi, '$1***MASKED***$3')
    .replace(/(["']?api_key["']?\s*[:=]\s*["'])(.*?)(["'])/gi, '$1***MASKED***$3');
}

export function logActivity(
  action: string,
  entityType: ActivityLog['entityType'],
  details: string,
  entityId?: string,
  status: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS',
  durationMs: number = Math.floor(Math.random() * 80) + 20
) {
  const currentUser = StorageService.getCurrentUser();
  const maskedDetails = maskSensitiveData(details);

  StorageService.addActivityLog({
    userName: currentUser?.name || 'Sistem',
    userEmail: currentUser?.email || 'system@assetcorp.id',
    userRole: currentUser?.role || 'system',
    action,
    entityType,
    entityId,
    details: maskedDetails,
    ipAddress: '127.0.0.1 (Local Preview)',
    durationMs,
    status,
  });

  // Jika webhook aktif, dispatch simulasi webhook
  const isWebhookActive = StorageService.getSettingValue('integration.webhook_enabled', 'false') === 'true';
  const webhookUrl = StorageService.getSettingValue('integration.webhook_url', '');
  if (isWebhookActive && webhookUrl) {
    console.log(`[WEBHOOK DISPATCHED] -> ${webhookUrl}`, {
      event: action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      triggeredBy: currentUser?.email,
    });
  }
}

export function exportLogsToDailyText(logs: ActivityLog[]): string {
  return logs
    .map(
      (log) =>
        `[${log.timestamp}] local.INFO: [${log.entityType}] [${log.action}] User="${log.userName}" (${log.userEmail}, Role=${log.userRole}) Status=${log.status} Duration=${log.durationMs}ms IP=${log.ipAddress} Details="${log.details}"`
    )
    .join('\n');
}
