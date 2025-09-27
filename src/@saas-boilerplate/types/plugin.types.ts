/**
 * Types seguros para Plugin Manager
 * Extraídos para evitar bundle contamination no client-side
 */

export interface PluginConfig {
  id: string
  name: string
  description?: string
  version: string
  enabled: boolean
  settings?: Record<string, any>
  metadata?: Record<string, any>
}

export interface PluginRegistry {
  [key: string]: PluginConfig
}

export interface PluginMetadata {
  name: string
  description?: string
  version: string
  author?: string
  homepage?: string
  repository?: string
  tags?: string[]
}

export interface PluginSettings {
  [key: string]: any
}

export interface PluginInstance {
  id: string
  config: PluginConfig
  metadata: PluginMetadata
  isActive: boolean
  settings: PluginSettings
}
