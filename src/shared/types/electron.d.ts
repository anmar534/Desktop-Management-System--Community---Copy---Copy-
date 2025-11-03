/**
 * Global Electron API Type Definitions
 * تعريفات أنواع Electron API العامة
 */

interface ElectronStore {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
}

interface ElectronSecureStore {
  get: (key: string) => Promise<unknown | null>
  set: (key: string, value: unknown) => Promise<void>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
}

interface ElectronApp {
  quit: () => Promise<void>
  minimize: () => Promise<void>
  maximize: () => Promise<boolean>
  close: () => Promise<boolean>
  getVersion: () => Promise<string>
}

interface ElectronMigration {
  getStatus: () => Promise<{
    success: boolean
    status?: {
      version: string
      lastMigration: string
      timestamp: string
      appliedMigrations: string[]
      appVersion: string
    }
    error?: string
  }>
}

interface ElectronLifecycle {
  ack: (payload: unknown) => Promise<void>
}

interface ElectronFS {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, data: string) => Promise<void>
  exists: (path: string) => Promise<boolean>
}

interface ElectronDialog {
  openFile: (options: unknown) => Promise<string | null>
  saveFile: (options: unknown) => Promise<string | null>
}

interface ElectronDesktop {
  secureAction: (payload: unknown) => Promise<unknown>
}

interface ElectronUpdates {
  check: () => Promise<unknown>
  onAvailable: (callback: (payload: unknown) => void) => () => void
  onDownloaded: (callback: (payload: unknown) => void) => () => void
}

interface ElectronAPI {
  store?: ElectronStore
  secureStore?: ElectronSecureStore
  app?: ElectronApp
  migration?: ElectronMigration
  lifecycle?: ElectronLifecycle
  fs?: ElectronFS
  dialog?: ElectronDialog
  desktop?: ElectronDesktop
  updates?: ElectronUpdates
  database?: unknown // Extended by specific modules
  on?: (channel: string, callback: (event: unknown, payload: unknown) => void) => void
  removeListener?: (channel: string, callback: (event: unknown, payload: unknown) => void) => void
  send?: (channel: string, data?: unknown) => void
}

interface PlatformInfo {
  isElectron: boolean
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  node: string
  chrome: string
  electron: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    platform?: PlatformInfo
  }
}

export {}
