'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export function ProductPropertiesStep() {
  const form = useFormContext();
  const { control, register, setValue, getValues, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'properties',
  });

  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});

  const handleValuesChange = (index: number, raw: string) => {
    const parsed = raw
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val.length > 0);

    setValueInputs((prev) => ({ ...prev, [index]: raw }));
    setValue(`properties.${index}.values`, parsed);
    form.trigger(`properties.${index}.values`);
  };

  const currentValues = (index: number) => {
    const values = (getValues(`properties.${index}.values`) as string[] | undefined) || [];
    return values;
  };

  const renderValueBadges = (index: number) => {
    const values = currentValues(index);
    if (!values.length) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {values.map((val, valIdx) => (
          <Badge key={`${val}-${valIdx}`} variant="secondary" className="text-xs">
            {val}
          </Badge>
        ))}
      </div>
    );
  };

  const propertiesErrors = formState.errors?.properties as any[] | undefined;

  const emptyState = useMemo(
    () => (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No properties added yet. Use the button above to create your first property.
      </div>
    ),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Properties</h3>
          <p className="text-sm text-muted-foreground">
            Add key/value sets that can carry multiple values per property.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            append({
              name: '',
              displayOrder: fields.length,
              values: [],
            })
          }
        >
          Add property
        </Button>
      </div>

      {fields.length === 0 && emptyState}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const error = propertiesErrors?.[index];
          const values = currentValues(index);
          const valueInput =
            valueInputs[index] !== undefined ? valueInputs[index] : values.join(', ');

          return (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Property #{index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground"
                  onClick={() => remove(index)}
                  aria-label="Remove property"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input
                    placeholder="e.g. Color, Size"
                    {...register(`properties.${index}.name` as const)}
                  />
                  {error?.name && (
                    <p className="text-xs text-destructive">{error.name.message as string}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Display Order</label>
                  <Input
                    type="number"
                    min={0}
                    {...register(`properties.${index}.displayOrder` as const, {
                      valueAsNumber: true,
                    })}
                  />
                  {error?.displayOrder && (
                    <p className="text-xs text-destructive">
                      {error.displayOrder.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Values (comma separated)
                  </label>
                  <Textarea
                    placeholder="e.g. Red, Blue, Green"
                    value={valueInput}
                    onChange={(e) => handleValuesChange(index, e.target.value)}
                  />
                  {renderValueBadges(index)}
                  {error?.values && (
                    <p className="text-xs text-destructive">{error.values.message as string}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
