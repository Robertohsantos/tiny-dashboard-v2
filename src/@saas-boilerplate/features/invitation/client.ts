/**
 * @file src/@saas-boilerplate/features/invitation/client.ts
 * @description This file serves as the barrel for client-related exports (presentation layer, hooks, contexts, and types)
 * of the invitation feature. It ensures that client-side modules are easily importable
 * and decoupled from server-side modules.
 *
 * The rules for this file are:
 * 1.  **ONLY** export modules that are exclusively used on the client-side (React components, hooks, contexts).
 * 2.  **ONLY** export interfaces and types that are shared between client and server or client-exclusive.
 * 3.  **NEVER** export controllers, procedures, repositories, or services that contain server-side logic.
 * 4.  Keep exports as specific as possible to avoid inefficient tree-shaking.
 */
export * from './invitation.interface'
export * from './presentation/components/invitation-dialog'
export * from './presentation/components/invitation-input'
export * from './presentation/components/invitation-input-footer'
export * from './presentation/components/invitation-input-list'
export * from './presentation/components/invitation-input-row'
export * from './presentation/contexts/invitation-input-context'
export * from './presentation/hooks/invitation-input-use-validate-invite-entry'
