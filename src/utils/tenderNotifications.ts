/**
 * Tender Notifications Utility
 */

export interface TenderNotification {
  id: string
  tenderId: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: string
}

export const sendTenderNotification = (notification: Omit<TenderNotification, 'id' | 'timestamp'>): void => {
  console.log('Sending tender notification:', notification)
}

export const getTenderNotifications = (tenderId: string): TenderNotification[] => {
  return []
}

export class TenderNotificationService {
  static send(notification: Omit<TenderNotification, 'id' | 'timestamp'>): void {
    sendTenderNotification(notification)
  }

  static getNotifications(tenderId: string): TenderNotification[] {
    return getTenderNotifications(tenderId)
  }
}

