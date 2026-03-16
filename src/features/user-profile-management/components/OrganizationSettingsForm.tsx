'use client';

import React, { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Clock3, Loader2, MapPinned, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  type OfficeDay,
  type OrganizationSettings,
} from '../services/organization-settings.service';
import { useOrganizationSettings } from '../hooks/useOrganizationSettings';

const officeDayValues = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const officeTimeSlotSchema = z
  .object({
    startTime: z.string().min(1, { message: 'Start time is required' }),
    endTime: z.string().min(1, { message: 'End time is required' }),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

const officeDaySchema = z
  .object({
    dayOfWeek: z.enum(officeDayValues),
    isOpen: z.boolean(),
    timeSlots: z.array(officeTimeSlotSchema),
  })
  .superRefine((value, context) => {
    if (!value.isOpen || value.timeSlots.length === 0) {
      return;
    }

    const sortedSlots = [...value.timeSlots].sort((left, right) =>
      left.startTime.localeCompare(right.startTime)
    );

    sortedSlots.forEach((slot, index) => {
      if (index === 0) {
        return;
      }

      const previousSlot = sortedSlots[index - 1];

      if (slot.startTime <= previousSlot.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Office time slots cannot overlap',
          path: ['timeSlots', index, 'startTime'],
        });
      }
    });
  });

const organizationSettingsSchema = z.object({
  id: z.number(),
  keycloakOrgId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  address: z.string().max(500, { message: 'Address must not exceed 500 characters' }),
  officeSchedule: z.array(officeDaySchema).length(7),
});

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

const officeDayLabels: Record<OfficeDay, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const defaultOfficeSchedule: OrganizationSettingsFormValues['officeSchedule'] = officeDayValues.map(
  (dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    timeSlots: [],
  })
);

function mapSettingsToFormValues(settings: OrganizationSettings): OrganizationSettingsFormValues {
  const scheduleByDay = new Map(settings.officeSchedule.map((entry) => [entry.dayOfWeek, entry]));

  return {
    id: settings.id,
    keycloakOrgId: settings.keycloakOrgId,
    name: settings.name,
    code: settings.code ?? '',
    address: settings.address ?? '',
    officeSchedule: officeDayValues.map((dayOfWeek) => {
      const existingDay = scheduleByDay.get(dayOfWeek);
      const timeSlots = existingDay?.timeSlots ?? [];

      return {
        dayOfWeek,
        isOpen: timeSlots.length > 0,
        timeSlots,
      };
    }),
  };
}

function mapFormValuesToRequest(values: OrganizationSettingsFormValues): OrganizationSettings {
  return {
    id: values.id,
    keycloakOrgId: values.keycloakOrgId,
    name: values.name,
    code: values.code?.trim() || null,
    address: values.address.trim() || null,
    officeSchedule: values.officeSchedule.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      timeSlots: day.isOpen ? day.timeSlots : [],
    })),
  };
}

function OfficeDayCard({
  index,
  control,
  isUpdating,
  watch,
  setValue,
}: {
  index: number;
  control: ReturnType<typeof useForm<OrganizationSettingsFormValues>>['control'];
  isUpdating: boolean;
  watch: ReturnType<typeof useForm<OrganizationSettingsFormValues>>['watch'];
  setValue: ReturnType<typeof useForm<OrganizationSettingsFormValues>>['setValue'];
}) {
  const dayPath = `officeSchedule.${index}` as const;
  const dayValues = watch(dayPath);
  const dayIsOpen = dayValues.isOpen;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `officeSchedule.${index}.timeSlots`,
  });

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{officeDayLabels[dayValues.dayOfWeek]}</p>
          <p className="text-sm text-muted-foreground">
            {dayIsOpen ? 'Set one or more office time ranges.' : 'Marked as closed.'}
          </p>
        </div>

        <FormField
          control={control}
          name={`officeSchedule.${index}.isOpen`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormLabel className="text-sm font-medium">Open</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  disabled={isUpdating}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked && fields.length === 0) {
                      append({ startTime: '09:00', endTime: '17:00' });
                    }
                    if (!checked) {
                      setValue(`officeSchedule.${index}.timeSlots`, [], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {dayIsOpen ? (
        <div className="mt-4 space-y-3">
          {fields.map((field, slotIndex) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border border-dashed p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <FormField
                control={control}
                name={`officeSchedule.${index}.timeSlots.${slotIndex}.startTime`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isUpdating} {...inputField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`officeSchedule.${index}.timeSlots.${slotIndex}.endTime`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" disabled={isUpdating} {...inputField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isUpdating}
                  onClick={() => remove(slotIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove time slot</span>
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isUpdating}
            onClick={() => append({ startTime: '09:00', endTime: '17:00' })}
          >
            <Plus className="h-4 w-4" />
            Add Time Slot
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function OrganizationSettingsForm() {
  const {
    organizationSettings,
    isLoading,
    isUpdating,
    error,
    refreshOrganizationSettings,
    saveOrganizationSettings,
  } = useOrganizationSettings();

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      id: 0,
      keycloakOrgId: '',
      name: '',
      code: '',
      address: '',
      officeSchedule: defaultOfficeSchedule,
    },
  });

  const { control, watch, setValue } = form;

  useEffect(() => {
    void refreshOrganizationSettings();
  }, [refreshOrganizationSettings]);

  useEffect(() => {
    if (!organizationSettings) {
      return;
    }

    form.reset(mapSettingsToFormValues(organizationSettings));
  }, [form, organizationSettings]);

  const onSubmit = async (values: OrganizationSettingsFormValues) => {
    const success = await saveOrganizationSettings(mapFormValuesToRequest(values));

    if (!success) {
      return;
    }

    form.reset(values);
  };

  if (isLoading && !organizationSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading organization settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Settings
        </CardTitle>
        <CardDescription>
          Review your organization details and maintain office timings for each day of the week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted/50" />
                    </FormControl>
                    <FormDescription>Organization name is read-only here.</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Code</FormLabel>
                    <FormControl>
                      <Input value={field.value ?? ''} disabled className="bg-muted/50" />
                    </FormControl>
                    <FormDescription>Organization code is read-only here.</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isUpdating}
                      placeholder="Enter organization address"
                      className="min-h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Clock3 className="h-4 w-4" />
                  Office Time Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add, change, or remove office timings for each weekday.
                </p>
              </div>

              <div className="space-y-3">
                {defaultOfficeSchedule.map((_, index) => (
                  <OfficeDayCard
                    key={officeDayValues[index]}
                    index={index}
                    control={control}
                    isUpdating={isUpdating}
                    watch={watch}
                    setValue={setValue}
                  />
                ))}
              </div>
            </div>

            {error ? (
              <div
                className={cn(
                  'rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'
                )}
              >
                {error}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" className="gap-2" disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Organization Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
