/**
 * Design System Entry Point
 *
 * نقطة دخول موحدة لنظام التصميم
 * يوفر وصول سهل إلى جميع الـ Design Tokens والسمات
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

// Export all tokens
export * from './tokens.config'
export * from './themes.config'

// Export default tokens
export { default as designTokens } from './tokens.config'
export { default as themes } from './themes.config'
