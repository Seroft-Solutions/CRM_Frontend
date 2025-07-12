/**
 * Service for generating and managing user availability and time slots
 * Handles automatic creation of weekly schedules and specific time slots
 */

import { 
  UserAvailabilityDTO, 
  UserAvailabilityDTODayOfWeek,
  AvailableTimeSlotDTO 
} from '@/core/api/generated/spring/schemas';

export interface DefaultAvailabilityConfig {
  startTime: string; // "09:00"
  endTime: string;   // "19:00"
  slotDurationMinutes: number; // 30
  workingDays: UserAvailabilityDTODayOfWeek[];
  timeZone?: string;
}

export interface GeneratedAvailability {
  userAvailabilities: Omit<UserAvailabilityDTO, 'id'>[];
  timeSlots: Omit<AvailableTimeSlotDTO, 'id'>[];
}

/**
 * Default configuration for 9am-7pm with 30-minute slots
 */
export const DEFAULT_AVAILABILITY_CONFIG: DefaultAvailabilityConfig = {
  startTime: "09:00",
  endTime: "19:00", 
  slotDurationMinutes: 30,
  workingDays: [
    UserAvailabilityDTODayOfWeek.MONDAY,
    UserAvailabilityDTODayOfWeek.TUESDAY,
    UserAvailabilityDTODayOfWeek.WEDNESDAY,
    UserAvailabilityDTODayOfWeek.THURSDAY,
    UserAvailabilityDTODayOfWeek.FRIDAY
  ],
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

export class AvailabilityService {
  /**
   * Generate weekly recurring availability for a user
   */
  static generateWeeklyAvailability(
    userId: number | string,
    config: DefaultAvailabilityConfig = DEFAULT_AVAILABILITY_CONFIG
  ): Omit<UserAvailabilityDTO, 'id'>[] {
    return config.workingDays.map(dayOfWeek => ({
      dayOfWeek,
      startTime: config.startTime,
      endTime: config.endTime,
      isAvailable: true,
      effectiveFrom: new Date().toISOString().split('T')[0], // Today
      effectiveTo: undefined, // No end date (permanent)
      timeZone: config.timeZone,
      user: { id: userId } as any,
      createdBy: 'system',
      createdDate: new Date().toISOString(),
      lastModifiedBy: 'system',
      lastModifiedDate: new Date().toISOString()
    }));
  }

  /**
   * Generate specific time slots for a date range
   */
  static generateTimeSlots(
    userId: number | string,
    startDate: Date,
    endDate: Date,
    config: DefaultAvailabilityConfig = DEFAULT_AVAILABILITY_CONFIG
  ): Omit<AvailableTimeSlotDTO, 'id'>[] {
    const slots: Omit<AvailableTimeSlotDTO, 'id'>[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeekEnum(currentDate.getDay());
      
      // Only generate slots for working days
      if (config.workingDays.includes(dayOfWeek)) {
        const daySlots = this.generateDaySlots(userId, currentDate, config);
        slots.push(...daySlots);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate time slots for a specific day
   */
  private static generateDaySlots(
    userId: number | string,
    date: Date,
    config: DefaultAvailabilityConfig
  ): Omit<AvailableTimeSlotDTO, 'id'>[] {
    const slots: Omit<AvailableTimeSlotDTO, 'id'>[] = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotDateTime = new Date(date);
      slotDateTime.setHours(currentHour, currentMin, 0, 0);

      slots.push({
        slotDateTime: slotDateTime.toISOString(),
        duration: config.slotDurationMinutes,
        isBooked: false,
        bookedAt: undefined,
        user: { id: userId } as any,
        createdBy: 'system',
        createdDate: new Date().toISOString(),
        lastModifiedBy: 'system', 
        lastModifiedDate: new Date().toISOString()
      });

      // Move to next slot
      currentMin += config.slotDurationMinutes;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    return slots;
  }

  /**
   * Convert JS day of week (0=Sunday) to enum
   */
  private static getDayOfWeekEnum(jsDay: number): UserAvailabilityDTODayOfWeek {
    const mapping = {
      0: UserAvailabilityDTODayOfWeek.SUNDAY,
      1: UserAvailabilityDTODayOfWeek.MONDAY,
      2: UserAvailabilityDTODayOfWeek.TUESDAY,
      3: UserAvailabilityDTODayOfWeek.WEDNESDAY,
      4: UserAvailabilityDTODayOfWeek.THURSDAY,
      5: UserAvailabilityDTODayOfWeek.FRIDAY,
      6: UserAvailabilityDTODayOfWeek.SATURDAY
    };
    return mapping[jsDay as keyof typeof mapping];
  }

  /**
   * Generate complete availability setup (weekly + next 30 days of slots)
   */
  static generateCompleteAvailability(
    userId: number | string,
    config: DefaultAvailabilityConfig = DEFAULT_AVAILABILITY_CONFIG
  ): GeneratedAvailability {
    const userAvailabilities = this.generateWeeklyAvailability(userId, config);
    
    // Generate slots for next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);
    
    const timeSlots = this.generateTimeSlots(userId, startDate, endDate, config);

    return {
      userAvailabilities,
      timeSlots
    };
  }

  /**
   * Check if user already has availability configured
   */
  static hasExistingAvailability(existingAvailabilities: UserAvailabilityDTO[]): boolean {
    return existingAvailabilities && existingAvailabilities.length > 0;
  }

  /**
   * Get summary of generated availability
   */
  static getAvailabilitySummary(generated: GeneratedAvailability): string {
    const daysCount = generated.userAvailabilities.length;
    const slotsCount = generated.timeSlots.length;
    const config = DEFAULT_AVAILABILITY_CONFIG;
    
    return `${daysCount} working days (${config.startTime}-${config.endTime}) with ${slotsCount} available time slots`;
  }
}