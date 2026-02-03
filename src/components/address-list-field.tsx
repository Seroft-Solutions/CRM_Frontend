'use client';

import React, { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { IntelligentLocationField } from '@/app/(protected)/(features)/customers/components/intelligent-location-field';

interface AddressListFieldProps {
  form: any;
  name?: string;
  label?: string;
  description?: string;
  showLocationFields?: boolean;
  locationLabel?: string;
}

export function AddressListField({
  form,
  name = 'addresses',
  label = 'Addresses',
  description,
  showLocationFields = false,
  locationLabel = 'Location',
}: AddressListFieldProps) {
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name,
    keyName: 'fieldId',
  });

  const addresses = form.watch(name) || [];

  useEffect(() => {
    if (!Array.isArray(addresses)) return;
    if (addresses.length > 0 && fields.length !== addresses.length) {
      replace(addresses);
    }
  }, [addresses, fields.length, replace]);

  useEffect(() => {
    if (fields.length === 0 && addresses.length === 0) {
      append({ title: '', completeAddress: '', area: null, isDefault: true });
    }
  }, [append, addresses.length, fields.length]);

  useEffect(() => {
    if (addresses.length === 0) return;
    const hasDefault = addresses.some((address: any) => address?.isDefault);
    if (!hasDefault) {
      form.setValue(`${name}.0.isDefault`, true, { shouldDirty: true });
    }
  }, [addresses, form, name]);

  const handleAdd = () => {
    const hasDefault = addresses.some((address: any) => address?.isDefault);
    append({ title: '', completeAddress: '', area: null, isDefault: !hasDefault });
  };

  const handleRemove = (index: number) => {
    remove(index);
    const nextAddresses = form.getValues(name) || [];
    if (nextAddresses.length > 0 && !nextAddresses.some((address: any) => address?.isDefault)) {
      form.setValue(`${name}.0.isDefault`, true, { shouldDirty: true });
    }
  };

  const handleDefaultChange = (value: string) => {
    const selectedIndex = Number(value);
    addresses.forEach((_: any, index: number) => {
      form.setValue(`${name}.${index}.isDefault`, index === selectedIndex, { shouldDirty: true });
    });
  };

  const selectedDefaultIndex = addresses.findIndex((address: any) => address?.isDefault);

  const arrayError = form.formState?.errors?.[name]?.message as string | undefined;

  const buildLocationValue = (address: any) => {
    return address?.area ?? null;
  };

  const getLocationError = (index: number) => {
    const entryErrors = form.formState?.errors?.[name]?.[index];
    return entryErrors?.area?.message;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
          {description ? <p className="text-xs text-gray-500 mt-1">{description}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add address
        </Button>
      </div>

      <RadioGroup
        value={selectedDefaultIndex >= 0 ? String(selectedDefaultIndex) : undefined}
        onValueChange={handleDefaultChange}
        className="space-y-4"
      >
        {fields.map((field, index) => (
          <div
            key={field.fieldId}
            className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FormLabel className="text-sm font-medium text-gray-800">Address {index + 1}</FormLabel>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <RadioGroupItem value={String(index)} />
                  <span>Default</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={fields.length === 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name={`${name}.${index}.title`}
              render={({ field: titleField }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Address title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Head Office, Warehouse"
                      {...titleField}
                      onChange={(event) => {
                        titleField.onChange(event.target.value);
                        form.trigger(`${name}.${index}.title`);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showLocationFields ? (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  {locationLabel}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <IntelligentLocationField
                    value={buildLocationValue(addresses[index])}
                    onChange={(value) => {
                      form.setValue(`${name}.${index}.area`, value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                </FormControl>
                {getLocationError(index) ? (
                  <p className="text-sm text-red-500">{getLocationError(index)}</p>
                ) : null}
              </FormItem>
            ) : null}

            <FormField
              control={form.control}
              name={`${name}.${index}.completeAddress`}
              render={({ field: addressField }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter address"
                      className="resize-none min-h-[80px]"
                      {...addressField}
                      onChange={(event) => {
                        addressField.onChange(event.target.value);
                        form.trigger(`${name}.${index}.completeAddress`);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </RadioGroup>
      {arrayError ? <p className="text-sm text-red-500">{arrayError}</p> : null}
    </div>
  );
}
