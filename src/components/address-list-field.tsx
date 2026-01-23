'use client';

import React, { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AddressListFieldProps {
  form: any;
  name?: string;
  label?: string;
  description?: string;
}

export function AddressListField({
  form,
  name = 'addresses',
  label = 'Addresses',
  description,
}: AddressListFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  const addresses = form.watch(name) || [];

  useEffect(() => {
    if (fields.length === 0) {
      append({ completeAddress: '', isDefault: true });
    }
  }, [append, fields.length]);

  useEffect(() => {
    if (addresses.length === 0) return;
    const hasDefault = addresses.some((address: any) => address?.isDefault);
    if (!hasDefault) {
      form.setValue(`${name}.0.isDefault`, true, { shouldDirty: true });
    }
  }, [addresses, form, name]);

  const handleAdd = () => {
    const hasDefault = addresses.some((address: any) => address?.isDefault);
    append({ completeAddress: '', isDefault: !hasDefault });
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
          <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
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
