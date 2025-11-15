'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEntityForm } from './product-form-provider';
import { RelationshipRenderer } from './relationship-renderer';
import { ProductImagesStep } from './product-images-step';
import { useGetAllProductCategories } from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import { useGetAllProductSubCategories } from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas/ProductImageDTO';
import {
  ORIENTATION_FIELDS,
  mapImagesByOrientation,
} from '@/features/product-images/utils/orientation';

function OrientationPreviewCard({
  field,
  image,
}: {
  field: (typeof ORIENTATION_FIELDS)[number];
  image?: ProductImageDTO | File;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(image.thumbnailUrl || image.cdnUrl || null);
    }
  }, [image]);

  const helperText = useMemo(() => {
    if (!image) return 'No image uploaded';

    if (image instanceof File) {
      const sizeInMb = (image.size / (1024 * 1024)).toFixed(2);
      return `${image.name} • ${sizeInMb} MB`;
    }

    return `${image.originalFilename ?? 'Uploaded image'}${
      image.fileSizeBytes ? ` • ${(image.fileSizeBytes / 1024).toFixed(1)} KB` : ''
    }`;
  }, [image]);

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{field.label}</p>
          <p className="text-xs text-slate-500">{field.description}</p>
        </div>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {field.badge}
        </Badge>
      </div>

      <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200">
        {previewUrl ? (
          <img src={previewUrl} alt={`${field.label} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Camera className="h-10 w-10" />
            <span className="text-sm font-medium">No image uploaded</span>
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-slate-600">{helperText}</p>
    </div>
  );
}

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface FormStepRendererProps {
  entity?: any;
}

function RelationshipValueResolver({ relConfig, value }: { relConfig: any; value: any }) {
  // Always call hooks in the same order to avoid React hooks rules violation
  const { data: categoriesData } = useGetAllProductCategories(
    { page: 0, size: 1000 },
    {
      query: {
        enabled: relConfig.name === 'category' && !!value,
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const { data: subCategoriesData } = useGetAllProductSubCategories(
    { page: 0, size: 1000 },
    {
      query: {
        enabled: relConfig.name === 'subCategory' && !!value,
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const resolveRelationshipDisplay = () => {
    switch (relConfig.name) {
      case 'category':
        return (
          <RelationshipDisplayValue
            value={value}
            allData={categoriesData}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="ProductCategories"
          />
        );

      case 'subCategory':
        return (
          <RelationshipDisplayValue
            value={value}
            allData={subCategoriesData}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="ProductSubCategories"
          />
        );

      default:
        return <span>{value ? 'Selected' : 'Not selected'}</span>;
    }
  };

  return resolveRelationshipDisplay();
}

function RelationshipDisplayValue({
  value,
  allData,
  displayField,
  primaryKey,
  multiple,
  label,
}: {
  value: any;
  allData: any;
  displayField: string;
  primaryKey: string;
  multiple: boolean;
  label: string;
}) {

  if (!value) {
    return <span className="text-muted-foreground italic">Not selected</span>;
  }

  if (!allData) {
    return <span className="text-muted-foreground italic">Loading...</span>;
  }

  const dataArray = Array.isArray(allData)
    ? allData
    : allData.content
      ? allData.content
      : allData.data
        ? allData.data
        : [];

  if (multiple && Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">None selected</span>;
    }

    const selectedItems = dataArray.filter((item: any) => value.includes(item[primaryKey]));

    if (selectedItems.length === 0) {
      return <span className="text-muted-foreground italic">{value.length} selected</span>;
    }

    const displayValues = selectedItems.map((item: any) => item[displayField]);
    return displayValues.join(', ');
  } else {
    const selectedItem = dataArray.find((item: any) => item[primaryKey] === value);

    return selectedItem ? (
      selectedItem[displayField]
    ) : (
      <span className="text-muted-foreground italic">Selected (ID: {value})</span>
    );
  }
}

export function FormStepRenderer({ entity }: FormStepRendererProps) {
  const { config, state, form, actions } = useEntityForm();
  const currentStepConfig = config.steps[state.currentStep];

  const orientationImageMap = useMemo(() => {
    const result: Record<(typeof ORIENTATION_FIELDS)[number]['name'], ProductImageDTO | File | undefined> = {
      frontImage: undefined,
      backImage: undefined,
      sideImage: undefined,
    };

    // During creation/edit, check for uploaded files in individual fields first
    result.frontImage = form.getValues('frontImage') || undefined;
    result.backImage = form.getValues('backImage') || undefined;
    result.sideImage = form.getValues('sideImage') || undefined;

    // If we have existing images (during edit) AND no new file was uploaded for that position, use those instead
    if (entity?.images?.length) {
      const existingMap = mapImagesByOrientation(entity.images);

      // Only use existing images if no new file was uploaded for that position
      if (!result.frontImage && existingMap.frontImage) result.frontImage = existingMap.frontImage;
      if (!result.backImage && existingMap.backImage) result.backImage = existingMap.backImage;
      if (!result.sideImage && existingMap.sideImage) result.sideImage = existingMap.sideImage;
    }

    return result;
  }, [form.watch('frontImage'), form.watch('backImage'), form.watch('sideImage'), entity?.images]);

  useEffect(() => {
    if (entity && !state.isLoading) {
      const formValues: Record<string, any> = {};

      config.fields.forEach((fieldConfig) => {
        const value = entity[fieldConfig.name];

        if (fieldConfig.type === 'date') {
          if (value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
                formValues[fieldConfig.name] = adjustedDate.toISOString().slice(0, 16);
              } else {
                formValues[fieldConfig.name] = '';
              }
            } catch {
              formValues[fieldConfig.name] = '';
            }
          } else {
            formValues[fieldConfig.name] = '';
          }
        } else if (fieldConfig.type === 'number') {
          formValues[fieldConfig.name] = value != null ? String(value) : '';
        } else {
          formValues[fieldConfig.name] = value || '';
        }
      });

      config.relationships.forEach((relConfig) => {
        const value = entity[relConfig.name];

        if (relConfig.multiple) {
          formValues[relConfig.name] = value
            ? value.map((item: any) => item[relConfig.primaryKey])
            : [];
        } else {
          formValues[relConfig.name] = value ? value[relConfig.primaryKey] : undefined;
        }
      });

      form.reset(formValues);
    }
  }, [entity, config, form, state.isLoading]);

  const renderField = (fieldName: string) => {
    const fieldConfig = config.fields.find((f) => f.name === fieldName);
    if (!fieldConfig) return null;

    return (
      <FormField
        key={fieldConfig.name}
        control={form.control}
        name={fieldConfig.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {fieldConfig.type === 'date' ? (
                <Input
                  type="datetime-local"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value || null);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.type === 'textarea' ? (
                <Textarea
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.type === 'number' ? (
                <Input
                  type="number"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : (fieldConfig.type === 'enum' && fieldConfig.options) ||
                fieldConfig.name === 'status' ? (
                <Select
                  value={
                    field.value || (fieldConfig.name?.toLowerCase() === 'status' ? 'ACTIVE' : '')
                  }
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.trigger(fieldConfig.name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        fieldConfig.name?.toLowerCase() === 'status'
                          ? field.value
                            ? transformEnumValue(field.value)
                            : 'Active'
                          : fieldConfig.placeholder
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldConfig.options ? (
                      fieldConfig.options.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {transformEnumValue(option.label || option.value)}
                        </SelectItem>
                      ))
                    ) : fieldConfig.name === 'status' ? (
                      <>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
              ) : fieldConfig.name?.toLowerCase().includes('email') ? (
                <Input
                  type="email"
                  placeholder="Enter email address (example: name@company.com)"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.name?.toLowerCase().includes('mobile') ||
                fieldConfig.name?.toLowerCase().includes('phone') ? (
                <Input
                  type="tel"
                  placeholder="Enter phone number (example: 03001234567)"
                  {...field}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
                    field.onChange(cleaned);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : (
                <Input
                  type="text"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderRelationship = (relationshipName: string) => {
    const relConfig = config.relationships.find((r) => r.name === relationshipName);
    if (!relConfig) return null;

    return (
      <FormField
        key={relConfig.name}
        control={form.control}
        name={relConfig.name}
        render={({ field }) => (
          <RelationshipRenderer
            relConfig={relConfig}
            field={field}
            form={form}
            actions={actions}
            config={config}
          />
        )}
      />
    );
  };

  const renderCurrentStep = () => {
    if (!currentStepConfig) return null;

    if (currentStepConfig.id === 'images') {
      return <ProductImagesStep form={form} existingImages={entity?.images} />;
    }

    if (currentStepConfig.id === 'review') {
      return (
        <div className="space-y-6">
          {config.steps.slice(0, -1).map((step, index) => {
            const stepFields = [...step.fields, ...step.relationships];
            if (stepFields.length === 0) return null;
            const isImagesStep = step.id === 'images';

            return (
              <div key={step.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    Step {index + 1} of {config.steps.length - 1}
                  </div>
                </div>
                {isImagesStep ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {ORIENTATION_FIELDS.map((field) => (
                      <OrientationPreviewCard
                        key={field.name}
                        field={field}
                        image={orientationImageMap[field.name]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {step.fields.map((fieldName) => {
                    const fieldConfig = config.fields.find((f) => f.name === fieldName);
                    if (!fieldConfig) return null;
                    const value = form.getValues(fieldName);

                    const displayValue = (() => {
                      if (!value)
                        return <span className="text-muted-foreground italic">Not set</span>;

                      if (fieldConfig.type === 'date') {
                        try {
                          const date = value instanceof Date ? value : new Date(value);
                          const dateStr = isNaN(date.getTime())
                            ? 'Invalid date'
                            : date.toLocaleDateString();
                          return dateStr;
                        } catch {
                          return <span className="text-muted-foreground italic">Invalid date</span>;
                        }
                      }

                      if (fieldConfig.type === 'boolean') {
                        return value ? 'Yes' : 'No';
                      }

                      if (fieldConfig.type === 'enum') {
                        const option = fieldConfig.options?.find((opt: any) => opt.value === value);
                        return option ? option.label : value;
                      }

                      if (fieldConfig.type === 'file') {
                        // For image files, show preview if available
                        if (fieldConfig.name?.toLowerCase().includes('image') && value instanceof File) {
                          return (
                            <div className="flex items-center gap-2">
                              <img
                                src={URL.createObjectURL(value)}
                                alt={`${fieldConfig.label} preview`}
                                className="h-8 w-8 object-cover rounded border"
                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                              />
                              <span className="text-xs text-muted-foreground">{value.name}</span>
                            </div>
                          );
                        }
                        const fileStr = value && value.name ? value.name : 'No file selected';
                        return fileStr;
                      }

                      return String(value);
                    })();

                    return (
                      <div key={fieldName} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {fieldConfig.label}
                        </div>
                        <div className="text-sm font-semibold text-foreground">{displayValue}</div>
                      </div>
                    );
                  })}
                  {step.relationships.map((relName) => {
                    const relConfig = config.relationships.find((r) => r.name === relName);
                    if (!relConfig) return null;
                    const value = form.getValues(relName);

                    return (
                      <div key={relName} className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {relConfig.ui.label}
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          <RelationshipValueResolver relConfig={relConfig} value={value} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div
          className={`grid ${config.ui.responsive.mobile} ${config.ui.responsive.tablet} ${config.ui.responsive.desktop} ${config.ui.spacing.fieldGap}`}
        >
          {/* Render regular fields */}
          {currentStepConfig.fields.map((fieldName) => renderField(fieldName))}

          {/* Render relationships */}
          {currentStepConfig.relationships.map((relationshipName) =>
            renderRelationship(relationshipName)
          )}
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(() => {})}>
        <Card>
          <CardContent className="p-4 sm:p-6">{renderCurrentStep()}</CardContent>
        </Card>
      </form>
    </Form>
  );
}
