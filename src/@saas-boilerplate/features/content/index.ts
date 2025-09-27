/**
 * Content Feature - Server-safe content management
 *
 * This feature provides a complete API for content management including:
 * - Blog posts
 * - Documentation
 * - Help articles
 * - Product updates
 *
 * All content is served through Igniter.js API to avoid bundle contamination
 * from Node.js file system operations in the content layer provider.
 */

export { ContentController } from './controllers/content.controller'
export { ContentProcedure } from './procedures/content.procedure'
export * from './content.interface'
