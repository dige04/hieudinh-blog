# Phase 02 - Legacy Cleanup

**Date**: 2026-02-08 | **Priority**: P1 | **Status**: Pending

## Context
- Legacy Vite React SPA exists alongside Next.js app
- Causes confusion, duplicate deps, wasted space (~50MB+)
- Root package.json still named `vite_react_shadcn_ts`

## Implementation Steps

### 1. Delete legacy Vite files
```bash
# Root-level legacy code
rm -rf src/ dist/ public/vite.svg
rm -f vite.config.ts index.html
rm -f components.json  # if legacy
```

### 2. Clean root configs
Remove legacy-only configs:
```bash
rm -f eslint.config.js  # if duplicated in apps/web
rm -f postcss.config.js  # if duplicated
rm -f tailwind.config.ts  # if duplicated
```

### 3. Fix root package.json
- Rename from `vite_react_shadcn_ts` to `my-portfolio` or `hieudinh-dev`
- Remove duplicate dependencies (Radix UI ~26 packages, React, Tailwind)
- Keep only workspace-level devDependencies

### 4. Add pnpm workspace config
Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
```

### 5. Normalize TypeScript versions
- Root: 5.8.3 → align with apps/web: 5.6.3 (or upgrade both)

## Success Criteria
- [ ] No `src/` directory at project root
- [ ] No Vite-related configs at root
- [ ] `pnpm install` completes without warnings
- [ ] `apps/web` builds successfully
- [ ] Root package.json has correct name and minimal deps

## Related Files
- `/package.json`
- `/vite.config.ts`
- `/tsconfig.json`
- `/src/**/*`
