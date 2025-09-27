# Migration Analysis Report

Generated on: 2025-01-09

## Summary

- **Total files analyzed**: 291
- **Files ready for migration**: 1
- **Files with warnings**: 0

## Components Using Original Hooks

### dashboard-content-v2.tsx

Location: `src/modules/dashboard/pages/dashboard-vendas/dashboard-content-v2.tsx`

Hooks to migrate:

- `useDashboardData` → `useDashboardDataValidated` (2 occurrences)
- `usePrefetchDashboardData` → `usePrefetchDashboardDataValidated` (3 occurrences)

## Hook Usage Statistics

| Hook Name                | Usage Count |
| ------------------------ | ----------- |
| usePrefetchDashboardData | 3           |
| useDashboardData         | 2           |

## Migration Status

✅ **Ready for automated migration**: The identified file can be automatically migrated using the migration script.

## Next Steps

1. Run dry-run to preview changes: `npm run migrate:hooks:dry-run`
2. Perform actual migration: `npm run migrate:hooks -- --migrate`
3. Test migrated components thoroughly
4. Enable feature flags progressively
