'use client';

import React, { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  ImagePlus,
  Clock3,
  Loader2,
  LocateFixed,
  MapPinned,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { getAcceptString, validateImageFile } from '@/lib/utils/image-validation';
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

const organizationSettingsSchema = z
  .object({
    id: z.number(),
    keycloakOrgId: z.string().min(1),
    name: z.string().min(1),
    code: z.string().nullable().optional(),
    address: z.string().max(500, { message: 'Address must not exceed 500 characters' }),
    logo: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    officeLatitude: z
      .number({ invalid_type_error: 'Office latitude must be a number' })
      .min(-90, { message: 'Latitude must be at least -90' })
      .max(90, { message: 'Latitude must be at most 90' })
      .nullable(),
    officeLongitude: z
      .number({ invalid_type_error: 'Office longitude must be a number' })
      .min(-180, { message: 'Longitude must be at least -180' })
      .max(180, { message: 'Longitude must be at most 180' })
      .nullable(),
    officeRadiusMeters: z.number().nullable(),
    officeSchedule: z.array(officeDaySchema).length(7),
  })
  .superRefine((value, context) => {
    const hasLatitude = value.officeLatitude !== null;
    const hasLongitude = value.officeLongitude !== null;

    if (hasLatitude || hasLongitude) {
      if (!hasLatitude) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Office latitude is required when geofence is configured',
          path: ['officeLatitude'],
        });
      }
      if (!hasLongitude) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Office longitude is required when geofence is configured',
          path: ['officeLongitude'],
        });
      }
    }
  });

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

async function reverseGeocodeOfficeLocation(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  const response = await fetch(`/api/location/reverse?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { locationName?: string; displayName?: string };

  return payload.locationName || payload.displayName || null;
}

async function getCurrentOfficeLocation(): Promise<{ latitude: number; longitude: number }> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission denied. Please allow location access.'));

          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('Location data is unavailable.'));

          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error('Location request timed out.'));

          return;
        }
        reject(new Error('Could not retrieve location from browser.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

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
    logo: settings.logo ?? '',
    logoUrl: settings.logoUrl ?? '',
    officeLatitude: settings.officeLatitude ?? null,
    officeLongitude: settings.officeLongitude ?? null,
    officeRadiusMeters: settings.officeRadiusMeters ?? null,
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
    logo: values.logo?.trim() || null,
    logoUrl: values.logoUrl?.trim() || null,
    officeLatitude: values.officeLatitude,
    officeLongitude: values.officeLongitude,
    officeRadiusMeters: values.officeRadiusMeters,
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
    isUploadingLogo,
    isRemovingLogo,
    error,
    refreshOrganizationSettings,
    saveOrganizationSettings,
    uploadLogo,
    removeLogo,
  } = useOrganizationSettings();

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      id: 0,
      keycloakOrgId: '',
      name: '',
      code: '',
      address: '',
      logo: '',
      logoUrl: '',
      officeLatitude: null,
      officeLongitude: null,
      officeRadiusMeters: null,
      officeSchedule: defaultOfficeSchedule,
    },
  });

  const { control, watch, setValue } = form;
  const [isFetchingLocation, setIsFetchingLocation] = React.useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = React.useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

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
    const submissionValues = { ...values };

    if (submissionValues.officeLatitude === null || submissionValues.officeLongitude === null) {
      try {
        const { latitude, longitude } = await getCurrentOfficeLocation();
        const locationName = await reverseGeocodeOfficeLocation(latitude, longitude);

        submissionValues.officeLatitude = latitude;
        submissionValues.officeLongitude = longitude;
        submissionValues.address = locationName || submissionValues.address;

        form.setValue('officeLatitude', latitude, { shouldDirty: true, shouldValidate: true });
        form.setValue('officeLongitude', longitude, { shouldDirty: true, shouldValidate: true });

        if (locationName) {
          form.setValue('address', locationName, { shouldDirty: true, shouldValidate: true });
        }
      } catch (error) {
        form.setError('address', {
          type: 'manual',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch office location before saving',
        });

        return;
      }
    }

    const success = await saveOrganizationSettings(mapFormValuesToRequest(submissionValues));

    if (!success) {
      return;
    }

    form.reset(submissionValues);
  };

  const handleFetchOfficeLocation = async () => {
    setIsFetchingLocation(true);
    form.clearErrors('address');

    try {
      const { latitude, longitude } = await getCurrentOfficeLocation();
      const locationName = await reverseGeocodeOfficeLocation(latitude, longitude);

      setValue('officeLatitude', latitude, { shouldDirty: true, shouldValidate: true });
      setValue('officeLongitude', longitude, { shouldDirty: true, shouldValidate: true });

      if (locationName) {
        setValue('address', locationName, { shouldDirty: true, shouldValidate: true });
      }
    } catch (error) {
      form.setError('address', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Failed to fetch office location',
      });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleLogoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = await validateImageFile(file);

    if (!validation.valid) {
      toast.error(validation.errors[0]?.message || 'Invalid image file');
      event.target.value = '';

      return;
    }

    if (validation.warnings.length > 0) {
      toast.warning(validation.warnings[0]?.message || 'Image selected');
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setSelectedLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!selectedLogoFile) {
      toast.error('Please select a logo first');

      return;
    }

    const updatedSettings = await uploadLogo(selectedLogoFile);

    if (!updatedSettings) {
      return;
    }

    form.setValue('logo', updatedSettings.logo ?? '', { shouldDirty: true });
    form.setValue('logoUrl', updatedSettings.logoUrl ?? '', { shouldDirty: true });

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoPreviewUrl(null);
    setSelectedLogoFile(null);
  };

  const handleRemoveLogo = async () => {
    const updatedSettings = await removeLogo();

    if (!updatedSettings) {
      return;
    }

    form.setValue('logo', updatedSettings.logo ?? '', { shouldDirty: true });
    form.setValue('logoUrl', updatedSettings.logoUrl ?? '', { shouldDirty: true });

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoPreviewUrl(null);
    setSelectedLogoFile(null);
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

  const currentLogo =
    logoPreviewUrl || watch('logoUrl') || (watch('logo')?.startsWith('http') ? watch('logo') : '');

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

            <div className="rounded-lg border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                  {currentLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentLogo}
                      alt="Organization logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Organization Logo</p>
                    <p className="text-xs text-muted-foreground">
                      Upload JPG, PNG, or WEBP up to 5 MB. Stored using the same image pipeline as
                      product images.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="organization-logo-input"
                      type="file"
                      accept={getAcceptString()}
                      className="hidden"
                      onChange={handleLogoSelection}
                      disabled={isUpdating || isUploadingLogo || isRemovingLogo}
                    />
                    <label
                      htmlFor="organization-logo-input"
                      className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Choose Logo
                    </label>

                    <Button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={
                        !selectedLogoFile || isUpdating || isUploadingLogo || isRemovingLogo
                      }
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveLogo}
                      disabled={!watch('logo') || isUpdating || isUploadingLogo || isRemovingLogo}
                    >
                      {isRemovingLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                      <FormLabel className="flex items-center gap-2">
                        <MapPinned className="h-4 w-4" />
                        Address
                      </FormLabel>
                      <FormDescription>
                        Use your current browser location to fill the office address automatically.
                      </FormDescription>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={isUpdating || isFetchingLocation}
                      onClick={handleFetchOfficeLocation}
                    >
                      {isFetchingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LocateFixed className="h-4 w-4" />
                      )}
                      Fetch Location
                    </Button>
                  </div>
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
