'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateProductVariant,
  useGetProductVariant,
  useUpdateProductVariant,
} from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  useCreateProductVariantSelection,
  useGetAllProductVariantSelections,
  useUpdateProductVariantSelection,
  useDeleteProductVariantSelection,
} from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { ProductVariantSelectionDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTOStatus';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  price: z.number().min(0).max(999999).optional(),
  stockQuantity: z.number().min(0, 'Stock quantity must be at least 0'),
  status: z.nativeEnum(ProductVariantDTOStatus),
});

type FormValues = z.infer<typeof formSchema>;

interface AttributeValue {
  attributeId: number;
  optionId?: number;
  rawValue?: string;
}

interface ProductVariantFormDialogProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  variantConfigId: number;
  variantId?: number | null;
  configAttributes: SystemConfigAttributeDTO[];
}

export function ProductVariantFormDialog({
  open,
  onClose,
  productId,
  productName,
  variantConfigId,
  variantId,
  configAttributes,
}: ProductVariantFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!variantId;

  const [attributeValues, setAttributeValues] = useState<Record<number, AttributeValue>>({});

  const { data: existingVariant, isLoading: isLoadingVariant } = useGetProductVariant(
    variantId!,
    {
      query: { enabled: isEdit },
    }
  );

  const { data: existingSelections } = useGetAllProductVariantSelections({
    'variant.id.equals': variantId!,
    size: 1000,
  }, {
    query: { enabled: isEdit },
  });

  const createVariantMutation = useCreateProductVariant();
  const updateVariantMutation = useUpdateProductVariant();
  const createSelectionMutation = useCreateProductVariantSelection();
  const updateSelectionMutation = useUpdateProductVariantSelection();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '',
      price: undefined,
      stockQuantity: 0,
      status: ProductVariantDTOStatus.ACTIVE,
    },
  });

  // Load existing variant data
  useEffect(() => {
    if (existingVariant) {
      form.reset({
        sku: existingVariant.sku,
        price: existingVariant.price,
        stockQuantity: existingVariant.stockQuantity,
        status: existingVariant.status,
      });
    } else if (!isEdit) {
      form.reset({
        sku: '',
        price: undefined,
        stockQuantity: 0,
        status: ProductVariantDTOStatus.ACTIVE,
      });
    }
  }, [existingVariant, isEdit, form]);

  // Load existing selections
  useEffect(() => {
    if (existingSelections) {
      const values: Record<number, AttributeValue> = {};
      existingSelections.forEach((selection) => {
        if (selection.attribute?.id) {
          values[selection.attribute.id] = {
            attributeId: selection.attribute.id,
            optionId: selection.option?.id,
            rawValue: selection.rawValue,
          };
        }
      });
      setAttributeValues(values);
    } else {
      setAttributeValues({});
    }
  }, [existingSelections]);

  const onSubmit = async (values: FormValues) => {
    try {
      let variantIdToUse = variantId;

      // Step 1: Create or update the variant
      if (isEdit) {
        await updateVariantMutation.mutateAsync({
          id: variantId!,
          data: {
            ...values,
            product: { id: productId },
          } as any,
        });
      } else {
        const newVariant = await createVariantMutation.mutateAsync({
          data: {
            ...values,
            product: { id: productId },
          } as any,
        });
        variantIdToUse = newVariant.id;
      }

      // Step 2: Create/update selections for each attribute
      for (const attr of configAttributes) {
        const attrValue = attributeValues[attr.id!];

        if (!attrValue) {
          // Skip attributes without values if not required
          if (!attr.isRequired) continue;
          throw new Error(`Please provide a value for ${attr.label}`);
        }

        const selectionData: any = {
          status: ProductVariantSelectionDTOStatus.ACTIVE,
          variant: { id: variantIdToUse },
          attribute: { id: attr.id },
        };

        if (attr.attributeType === SystemConfigAttributeDTOAttributeType.ENUM) {
          if (!attrValue.optionId) {
            if (attr.isRequired) {
              throw new Error(`Please select an option for ${attr.label}`);
            }
            continue;
          }
          selectionData.option = { id: attrValue.optionId };
        } else {
          if (!attrValue.rawValue && attr.isRequired) {
            throw new Error(`Please provide a value for ${attr.label}`);
          }
          selectionData.rawValue = attrValue.rawValue;
        }

        // Find existing selection for this attribute
        const existingSelection = existingSelections?.find(
          (s) => s.attribute?.id === attr.id
        );

        if (existingSelection) {
          await updateSelectionMutation.mutateAsync({
            id: existingSelection.id!,
            data: selectionData,
          });
        } else {
          await createSelectionMutation.mutateAsync({
            data: selectionData,
          });
        }
      }

      toast.success(isEdit ? 'Variant updated successfully' : 'Variant created successfully');

      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === '/api/product-variants' ||
          query.queryKey[0] === '/api/product-variant-selections',
      });

      onClose();
    } catch (error: any) {
      toast.error(error.message || (isEdit ? 'Failed to update variant' : 'Failed to create variant'));
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Variant</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the variant details' : `Create a new variant for ${productName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Variant Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="e.g., PROD-001-S-RED"
                  {...form.register('sku')}
                />
                {form.formState.errors.sku && (
                  <p className="text-sm text-red-600">{form.formState.errors.sku.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('price', { valueAsNumber: true })}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  {...form.register('stockQuantity', { valueAsNumber: true })}
                />
                {form.formState.errors.stockQuantity && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.stockQuantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) =>
                    form.setValue('status', value as ProductVariantDTOStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProductVariantDTOStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ProductVariantDTOStatus.INACTIVE}>Inactive</SelectItem>
                    <SelectItem value={ProductVariantDTOStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Attribute Selections */}
          {configAttributes.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Variant Attributes</h3>
              <div className="space-y-3">
                {configAttributes.map((attr) => (
                  <AttributeInput
                    key={attr.id}
                    attribute={attr}
                    value={attributeValues[attr.id!]}
                    onChange={(value) =>
                      setAttributeValues((prev) => ({ ...prev, [attr.id!]: value }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createVariantMutation.isPending ||
                updateVariantMutation.isPending ||
                createSelectionMutation.isPending ||
                updateSelectionMutation.isPending
              }
            >
              {(createVariantMutation.isPending ||
                updateVariantMutation.isPending ||
                createSelectionMutation.isPending ||
                updateSelectionMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? 'Update' : 'Create'} Variant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Attribute Input Component
interface AttributeInputProps {
  attribute: SystemConfigAttributeDTO;
  value?: AttributeValue;
  onChange: (value: AttributeValue) => void;
}

function AttributeInput({ attribute, value, onChange }: AttributeInputProps) {
  const { data: options } = useGetAllSystemConfigAttributeOptions({
    'attribute.id.equals': attribute.id!,
    size: 1000,
    sort: ['sortOrder,asc'],
  }, {
    query: { enabled: attribute.attributeType === SystemConfigAttributeDTOAttributeType.ENUM },
  });

  if (attribute.attributeType === SystemConfigAttributeDTOAttributeType.ENUM) {
    return (
      <div className="space-y-2">
        <Label>
          {attribute.label}
          {attribute.isRequired && <span className="text-red-600 ml-1">*</span>}
        </Label>
        <Select
          value={value?.optionId?.toString() || ''}
          onValueChange={(val) =>
            onChange({
              attributeId: attribute.id!,
              optionId: parseInt(val),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${attribute.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.id} value={option.id!.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const inputType =
    attribute.attributeType === SystemConfigAttributeDTOAttributeType.NUMBER ? 'number' : 'text';

  return (
    <div className="space-y-2">
      <Label>
        {attribute.label}
        {attribute.isRequired && <span className="text-red-600 ml-1">*</span>}
      </Label>
      <Input
        type={inputType}
        value={value?.rawValue || ''}
        onChange={(e) =>
          onChange({
            attributeId: attribute.id!,
            rawValue: e.target.value,
          })
        }
        placeholder={`Enter ${attribute.label}`}
      />
    </div>
  );
}
