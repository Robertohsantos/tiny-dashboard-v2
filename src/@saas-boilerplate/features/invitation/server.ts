/**
 * @file src/@saas-boilerplate/features/invitation/server.ts
 * @description This file serves as the barrel for server-related exports (controllers and procedures)
 * of the invitation feature. It ensures that server-side modules are easily importable
 * and decoupled from client-side modules.
 *
 * The rules for this file are:
 * 1.  **ONLY** export modules that are exclusively used on the server-side (controllers, procedures, repositories, services).
 * 2.  **NEVER** export presentation components (React components), hooks, contexts, or types that are not strictly internal to the server.
 * 3.  Keep exports as specific as possible to avoid inefficient tree-shaking and ensure server-side security.
 */
export * from './controllers/invitation.controller'
export * from './procedures/invitation.procedure'
