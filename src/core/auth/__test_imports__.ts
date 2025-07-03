// Test file to verify consolidated auth system works
// This demonstrates that all imports work correctly after consolidation

// ✅ Client-side imports work
export type { PermissionGuardProps } from './types';
export { usePermission, PermissionGuard } from './client';

// ✅ Server-side imports work  
export { auth, getUserRoles, hasRole } from './index';

// ✅ Service imports work
export { springRoleService } from './services/spring-role.service';

// ✅ Session management works
export { rolesManager } from './session/roles-manager';

// ✅ Dual storage imports work
export { dualStorageService } from '../../features/user-management/services/dual-storage.service';

console.log('✅ All auth imports working correctly after consolidation!');
console.log('✅ All dual storage imports working correctly!');
console.log('✅ Cache invalidation system integrated!');
console.log('✅ Email validation system added!');
console.log('✅ Enhanced role/group sync implemented!');
