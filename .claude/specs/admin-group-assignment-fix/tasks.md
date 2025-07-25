# Implementation Tasks - Admin Group Assignment Fix

## Core Service Implementation

- [ ] 1. Create AdminGroupService class
  - Implement group querying, creation, and assignment methods
  - Add comprehensive error handling with retry logic  
  - Include verification capabilities after assignment
  - Add exponential backoff for user assignment operations
  - _Leverage: src/core/api/generated/keycloak/index.ts, src/app/api/keycloak/groups/route.ts_
  - _Requirements: 1.1, 2.1, 2.2, 3.4_

- [ ] 2. Add AdminGroupService interfaces and types
  - Create AdminGroupAssignmentResult interface
  - Create AdminGroupAssignmentRequest interface  
  - Create AdminGroupVerificationResult interface
  - Add error types for admin group operations
  - _Leverage: src/core/api/generated/keycloak/schemas/GroupRepresentation.ts_
  - _Requirements: 1.1, 2.1, 5.3_

## Organization Setup Service Enhancement

- [ ] 3. Enhance OrganizationSetupService with admin group assignment
  - Add assignUserToAdminGroup method to existing service
  - Integrate admin assignment step after user membership addition
  - Update OrganizationSetupResult interface to include admin assignment info
  - Ensure backward compatibility with existing setup flow
  - _Leverage: src/services/organization/organization-setup.service.ts_
  - _Requirements: 1.1, 4.1, 4.2, 4.4_

- [ ] 4. Update organization setup flow integration
  - Add admin group assignment as Step 3.5 in existing setup process
  - Ensure graceful degradation when admin assignment fails
  - Maintain existing error handling patterns from current setup service
  - Add detailed logging following existing console.log patterns
  - _Leverage: src/services/organization/organization-setup.service.ts (existing flow structure)_
  - _Requirements: 4.1, 4.2, 3.1, 3.2_

## API Route Enhancement

- [ ] 5. Enhance members API route for admin assignment
  - Extend POST handler in existing members route to support assignAdminRole flag
  - Add admin group assignment to simple member addition flow (used by org setup)
  - Maintain existing invitation flow functionality without changes
  - Add admin assignment result to API response
  - _Leverage: src/app/api/keycloak/organizations/[organizationId]/members/route.ts_
  - _Requirements: 4.1, 4.3, 1.1_

- [ ] 6. Add admin group verification endpoint
  - Create verification method to check user admin group assignment
  - Add endpoint to query user's admin group membership status
  - Implement verification with retry logic for eventual consistency
  - Follow existing API route patterns and error handling
  - _Leverage: src/app/api/keycloak/users/[userId]/groups/route.ts_
  - _Requirements: 5.1, 5.2, 5.4_

## Error Handling and Logging

- [ ] 7. Implement comprehensive error handling strategy
  - Add specific error classes for admin group operations
  - Implement retry logic with exponential backoff for group assignments
  - Add graceful degradation ensuring setup completion despite failures
  - Follow existing error handling patterns in organization setup
  - _Leverage: src/services/organization/organization-setup.service.ts (existing error patterns)_
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 8. Add detailed logging and monitoring
  - Implement structured logging for all admin group operations
  - Add success/failure tracking with contextual information
  - Include audit logging for security compliance
  - Follow existing console.log patterns used throughout setup service
  - _Leverage: src/services/organization/organization-setup.service.ts (existing logging patterns)_
  - _Requirements: 3.1, 5.5_

## Hook Integration

- [ ] 9. Update useOrganizationSetup hook
  - Add admin group assignment progress tracking
  - Include admin assignment result in hook state
  - Add user notifications for partial setup completion
  - Maintain existing toast notification patterns
  - _Leverage: src/hooks/useOrganizationSetup.ts_
  - _Requirements: 4.2, 3.3, 1.1_

## Testing Implementation

- [ ] 10. Create unit tests for AdminGroupService
  - Test group creation, assignment, and verification scenarios
  - Test error handling and retry logic
  - Test case-insensitive group search functionality
  - Test concurrent group creation handling (409 conflicts)
  - _Leverage: existing test patterns from codebase, __tests__ directory structure_
  - _Requirements: 2.4, 3.4, 5.1_

- [ ] 11. Add integration tests for enhanced setup flow
  - Test complete organization setup with admin assignment
  - Test setup completion with admin assignment failures
  - Test API route enhancements with admin assignment flag
  - Verify backward compatibility with existing flows
  - _Leverage: existing test utilities and patterns_
  - _Requirements: 1.1, 4.4, 5.1, 5.4_

- [ ] 12. Add end-to-end validation tests
  - Test complete organization creator journey with admin assignment
  - Verify user receives both organization membership and admin group assignment
  - Test error scenarios and partial failure handling
  - Validate setup progress tracking includes admin assignment step
  - _Leverage: existing e2e test patterns and utilities_
  - _Requirements: 1.1, 1.5, 4.2, 5.5_