/**
 * Analytics Service
 */

export interface AnalyticsEvent {
  name: string
  data?: Record<string, any>
}

export class AnalyticsService {
  static trackEvent(event: AnalyticsEvent): void {
    console.log('Tracking event:', event)
  }

  static getAnalytics(): Record<string, any> {
    return {}
  }

  static clearAnalytics(): void {
    console.log('Clearing analytics')
  }
}

export const analyticsService = AnalyticsService

