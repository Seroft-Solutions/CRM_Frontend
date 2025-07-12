/**
 * Hook to create real availability records for specific users
 * This creates actual database records for UserAvailability and AvailableTimeSlot
 */

import {
  AvailabilityService,
  DEFAULT_AVAILABILITY_CONFIG,
} from './availability-service';

import {
  useCreateUserAvailability,
  useGetAllUserAvailabilities,
} from '@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen';

import {
  useCreateAvailableTimeSlot,
} from '@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen';

/**
 * React hook to handle real availability creation for specific users
 */
export function useUserAvailabilityCreation() {
  const { mutate: createUserAvailability } = useCreateUserAvailability();
  const { mutate: createAvailableTimeSlot } = useCreateAvailableTimeSlot();
  const { data: existingAvailabilities, refetch: refetchAvailabilities } = useGetAllUserAvailabilities();
  
  const ensureUserHasAvailability = async (userId: number | string): Promise<boolean> => {
    try {
      console.log('🔍 Checking availability for user:', userId);
      
      // Check if this user already has availability
      const userExistingAvailability = existingAvailabilities?.filter(
        avail => avail.user?.id?.toString() === userId.toString()
      ) || [];
      
      if (userExistingAvailability.length > 0) {
        console.log('✅ User already has availability:', userExistingAvailability.length, 'schedules');
        return true;
      }
      
      console.log('🆕 Creating availability for user:', userId);
      
      // Generate availability records for this specific user
      const generated = AvailabilityService.generateCompleteAvailability(
        typeof userId === 'string' ? userId : userId // Handle both string and number IDs
      );
      
      console.log('📊 Creating records for user', userId, ':', {
        userAvailabilities: generated.userAvailabilities.length,
        timeSlots: generated.timeSlots.length
      });
      
      // Create UserAvailability records (weekly schedule)
      const availabilityPromises = generated.userAvailabilities.map(availability => 
        new Promise<void>((resolve, reject) => {
          createUserAvailability(
            { data: availability as any },
            {
              onSuccess: () => {
                console.log('✅ Created UserAvailability for', availability.dayOfWeek);
                resolve();
              },
              onError: (error) => {
                console.error('❌ Failed to create UserAvailability:', error);
                reject(error);
              }
            }
          );
        })
      );
      
      await Promise.all(availabilityPromises);
      console.log('✅ All UserAvailability records created for user:', userId);
      
      // Create AvailableTimeSlot records (specific time slots)
      const batchSize = 10; // Create in batches to avoid overwhelming the API
      for (let i = 0; i < generated.timeSlots.length; i += batchSize) {
        const batch = generated.timeSlots.slice(i, i + batchSize);
        
        const batchPromises = batch.map(timeSlot => 
          new Promise<void>((resolve, reject) => {
            createAvailableTimeSlot(
              { data: timeSlot as any },
              {
                onSuccess: () => resolve(),
                onError: (error) => {
                  console.error('❌ Failed to create AvailableTimeSlot:', error);
                  reject(error);
                }
              }
            );
          })
        );
        
        await Promise.all(batchPromises);
        console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1} of time slots for user:`, userId);
      }
      
      // Refetch to get the latest data
      await refetchAvailabilities();
      
      console.log('🎉 Successfully created all availability records for user:', userId);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to create availability for user:', userId, error);
      return false;
    }
  };
  
  return { ensureUserHasAvailability };
}

/**
 * Legacy hook for customer creation - now just logs
 */
export function useCustomerAvailabilityCreation() {
  const createAvailabilityForCustomer = async (customerId: number): Promise<void> => {
    console.log('🆕 Customer created:', customerId, '- availability will be created when needed for meetings');
  };
  
  return { createAvailabilityForCustomer };
}