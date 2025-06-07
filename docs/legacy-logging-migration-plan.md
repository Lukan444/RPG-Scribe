# Legacy Logging Migration Plan

## Overview

This document outlines the systematic migration of legacy console.log/error/warn calls to the unified SystemLoggerService and ActivityLogService architecture.

## Migration Priority Levels

### Priority 1: Critical Service Layer Errors (IMMEDIATE)
**Target**: Service layer console.error calls that should use SystemLogger
**Impact**: High - These are production errors that need proper logging
**Files**: 
- `src/services/*.service.ts`
- `src/services/adapters/*.ts`
- `src/services/vector/*.ts`
- `src/services/transcription/*.ts`

### Priority 2: Component Error Handling (HIGH)
**Target**: Component error handling that should use SystemLogger
**Impact**: Medium-High - User-facing errors need proper tracking
**Files**:
- `src/components/**/*.tsx` (error boundaries, catch blocks)
- `src/pages/**/*.tsx` (error handling)
- `src/contexts/**/*.tsx` (context errors)

### Priority 3: Authentication & Security (HIGH)
**Target**: Auth-related logging that should use ActivityLogger
**Impact**: High - Security events need audit trail
**Files**:
- `src/contexts/AuthContext.tsx`
- `src/components/auth/*.tsx`
- `src/pages/auth/*.tsx`

### Priority 4: Admin Operations (MEDIUM)
**Target**: Admin panel operations that should use ActivityLogger
**Impact**: Medium - Admin actions need audit trail
**Files**:
- `src/components/admin/*.tsx`
- `src/pages/Admin.tsx`

### Priority 5: Development/Debug Logging (LOW)
**Target**: Development console.log calls
**Impact**: Low - Can remain for now, clean up later
**Action**: Leave as-is for development, remove in production builds

## Migration Strategy

### Phase 1: Service Layer Migration (Week 1)
1. **FirestoreService**: Replace console.error with systemLogger
2. **Vector Services**: Migrate VertexAI* services to systemLogger
3. **Transcription Services**: Migrate LiveTranscription* services
4. **Entity Services**: Migrate character, location, item services

### Phase 2: Authentication Migration (Week 1)
1. **AuthContext**: Migrate to ActivityLogger for user actions
2. **Auth Components**: Migrate login/register/reset flows
3. **Social Auth**: Migrate social login events

### Phase 3: Component Error Handling (Week 2)
1. **Error Boundaries**: Migrate to systemLogger
2. **Page Components**: Migrate error handling
3. **Context Providers**: Migrate context errors

### Phase 4: Admin Operations (Week 2)
1. **Admin Dashboard**: Migrate admin actions to ActivityLogger
2. **Configuration Changes**: Migrate settings updates
3. **Data Operations**: Migrate CRUD operations

## Implementation Guidelines

### For System Logs (Technical Operations)
```typescript
// OLD
console.error('Database operation failed:', error);

// NEW
import { useSystemLogger } from '../hooks/useSystemLogger';
const logger = useSystemLogger({ module: SystemModule.DATABASE });
logger.error(LogCategory.DATABASE, 'Database operation failed', error, {
  operation: 'create',
  entityType: 'character'
});
```

### For Activity Logs (User Actions)
```typescript
// OLD
console.log('User updated profile');

// NEW
import { ActivityLogService, ActivityAction } from '../services/activityLog.service';
const activityLogService = ActivityLogService.getInstance();
await activityLogService.logActivity(
  user.id,
  user.name,
  user.email,
  ActivityAction.PROFILE_UPDATE,
  'User updated profile picture',
  ipAddress,
  userAgent
);
```

## Files to Keep Console Logging

### Intentional Console Usage (DO NOT MIGRATE)
1. **resizeObserverErrorHandler.ts**: Error suppression system
2. **resizeObserverPolyfill.ts**: Development debugging
3. **utils/logger.ts**: Base logger implementation
4. **Test files**: All files in `tests/` directories
5. **Setup files**: `setupVitest.ts`, test configuration

### Development-Only Logging (MIGRATE LATER)
1. **Translation utilities**: `translationTest.ts`
2. **Sample data utilities**: `populateSampleData.ts`
3. **Debug utilities**: Various debug console.log calls

## Success Criteria

### Phase 1 Complete
- [ ] Zero console.error calls in service layer
- [ ] All service errors logged through SystemLogger
- [ ] Proper error categorization and metadata

### Phase 2 Complete
- [ ] All authentication events in ActivityLogger
- [ ] User actions properly audited
- [ ] Security events tracked

### Phase 3 Complete
- [ ] Component errors in SystemLogger
- [ ] Error boundaries using unified logging
- [ ] Context errors properly categorized

### Phase 4 Complete
- [ ] Admin actions in ActivityLogger
- [ ] Configuration changes audited
- [ ] Data operations tracked

## Monitoring & Validation

### After Each Phase
1. **Build Validation**: Ensure zero TypeScript errors
2. **Runtime Testing**: Verify logs appear in dashboard
3. **Log Separation**: Confirm System vs Activity log separation
4. **Filter Testing**: Verify all filters work correctly
5. **Performance**: Ensure no performance degradation

### Final Validation
1. **Complete Audit**: Search for remaining console calls
2. **Dashboard Testing**: Verify all log types display correctly
3. **Export Testing**: Verify log export functionality
4. **Production Testing**: Test in production-like environment

## Timeline

- **Week 1**: Phases 1-2 (Service Layer + Authentication)
- **Week 2**: Phases 3-4 (Components + Admin)
- **Week 3**: Testing, validation, and cleanup
- **Week 4**: Documentation and final review

## Notes

- Maintain backward compatibility during migration
- Test each phase thoroughly before proceeding
- Document any issues or edge cases discovered
- Consider performance impact of increased logging
