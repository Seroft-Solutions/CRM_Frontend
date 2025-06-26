// Dynamic hook resolver for configuration-driven forms
import { 
  useGetAllPriorities,
  useSearchPriorities,
  useCountPriorities
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";
import { 
  useGetAllCallTypes,
  useSearchCallTypes,
  useCountCallTypes
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";
import { 
  useGetAllSubCallTypes,
  useSearchSubCallTypes,
  useCountSubCallTypes
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";
import { 
  useGetAllCallCategories,
  useSearchCallCategories,
  useCountCallCategories
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import { 
  useGetAllSources,
  useSearchSources,
  useCountSources
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { 
  useGetAllCustomers,
  useSearchCustomers,
  useCountCustomers
} from "@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen";
import { 
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import { 
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { 
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

// Hook registry mapping string names to actual hook functions
export const hookRegistry = {
  // Priority hooks
  'useGetAllPriorities': useGetAllPriorities,
  'useSearchPriorities': useSearchPriorities,
  'useCountPriorities': useCountPriorities,
  
  // Call Type hooks
  'useGetAllCallTypes': useGetAllCallTypes,
  'useSearchCallTypes': useSearchCallTypes,
  'useCountCallTypes': useCountCallTypes,
  
  // Sub Call Type hooks
  'useGetAllSubCallTypes': useGetAllSubCallTypes,
  'useSearchSubCallTypes': useSearchSubCallTypes,
  'useCountSubCallTypes': useCountSubCallTypes,
  
  // Call Category hooks
  'useGetAllCallCategories': useGetAllCallCategories,
  'useSearchCallCategories': useSearchCallCategories,
  'useCountCallCategories': useCountCallCategories,
  
  // Source hooks
  'useGetAllSources': useGetAllSources,
  'useSearchSources': useSearchSources,
  'useCountSources': useCountSources,
  
  // Customer hooks
  'useGetAllCustomers': useGetAllCustomers,
  'useSearchCustomers': useSearchCustomers,
  'useCountCustomers': useCountCustomers,
  
  // Channel Type hooks
  'useGetAllChannelTypes': useGetAllChannelTypes,
  'useSearchChannelTypes': useSearchChannelTypes,
  'useCountChannelTypes': useCountChannelTypes,
  
  // User Profile hooks
  'useGetAllUserProfiles': useGetAllUserProfiles,
  'useSearchUserProfiles': useSearchUserProfiles,
  'useCountUserProfiles': useCountUserProfiles,
  
  // Call Status hooks
  'useGetAllCallStatuses': useGetAllCallStatuses,
  'useSearchCallStatuses': useSearchCallStatuses,
  'useCountCallStatuses': useCountCallStatuses,
} as const;

export type HookName = keyof typeof hookRegistry;

/**
 * Resolves hook name string to actual hook function
 */
export function resolveHook(hookName: string): any {
  return hookRegistry[hookName as HookName];
}

/**
 * Checks if a hook name exists in the registry
 */
export function isValidHookName(hookName: string): hookName is HookName {
  return hookName in hookRegistry;
}
