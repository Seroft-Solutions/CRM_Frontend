'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSystemConfigAttributeOption } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTO';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';

interface AddAttributeOptionDialogProps {
  attribute: SystemConfigAttributeDTO;
  options: SystemConfigAttributeOptionDTO[];
  onOptionCreated?: (option: SystemConfigAttributeOptionDTO) => void;
}

interface AttributeOptionFormState {
  code: string;
  label: string;
  sortOrder: string;
  status: SystemConfigAttributeOptionDTOStatus;
}

interface AttributeOptionFormErrors {
  code?: string;
  label?: string;
  sortOrder?: string;
  status?: string;
  root?: string;
}

const isColorAttribute = (attribute: SystemConfigAttributeDTO) => {
  const source = `${attribute.name ?? ''} ${attribute.label ?? ''}`.toLowerCase();

  return source.includes('color');
};

const buildDefaultFormState = (
  attribute: SystemConfigAttributeDTO,
  options: SystemConfigAttributeOptionDTO[]
): AttributeOptionFormState => {
  const nextSortOrder =
    options.reduce((max, option) => Math.max(max, Number(option.sortOrder) || 0), -1) + 1;

  return {
    code: isColorAttribute(attribute) ? '#000000' : '',
    label: '',
    sortOrder: String(nextSortOrder),
    status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
  };
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { title?: string; detail?: string; message?: string } };
      message?: string;
    };

    return (
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.message ||
      maybeAxiosError.message ||
      'Unexpected error'
    );
  }

  return 'Unexpected error';
};

export function AddAttributeOptionDialog({
  attribute,
  options,
  onOptionCreated,
}: AddAttributeOptionDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<AttributeOptionFormState>(() =>
    buildDefaultFormState(attribute, options)
  );
  const [errors, setErrors] = useState<AttributeOptionFormErrors>({});
  const { mutateAsync: createOption, isPending } = useCreateSystemConfigAttributeOption();

  const attributeLabel = attribute.label ?? attribute.name ?? 'Attribute';
  const useColorCode = useMemo(() => isColorAttribute(attribute), [attribute]);

  useEffect(() => {
    if (!open) {
      setFormState(buildDefaultFormState(attribute, options));
      setErrors({});
    }
  }, [attribute, open, options]);

  const validate = (): AttributeOptionFormErrors => {
    const nextErrors: AttributeOptionFormErrors = {};
    const trimmedCode = formState.code.trim();
    const trimmedLabel = formState.label.trim();
    const normalizedSortOrder = Number(formState.sortOrder);
    const normalizedExistingCodes = new Set(
      options.map((option) => option.code?.trim().toUpperCase()).filter(Boolean)
    );

    if (!trimmedCode) {
      nextErrors.code = 'Code is required';
    } else if (useColorCode) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(trimmedCode)) {
        nextErrors.code = 'Code must be a valid hex color like #FF5733';
      }
    } else if (!/^[A-Za-z0-9_-]+$/.test(trimmedCode)) {
      nextErrors.code = 'Code can contain only letters, numbers, hyphen, and underscore';
    }

    if (trimmedCode && normalizedExistingCodes.has(trimmedCode.toUpperCase())) {
      nextErrors.code = 'This option code already exists for the attribute';
    }

    if (!trimmedLabel) {
      nextErrors.label = 'Label is required';
    } else if (trimmedLabel.length > 100) {
      nextErrors.label = 'Label must not exceed 100 characters';
    }

    if (formState.sortOrder.trim() === '') {
      nextErrors.sortOrder = 'Sort order is required';
    } else if (!Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 0) {
      nextErrors.sortOrder = 'Sort order must be a whole number greater than or equal to 0';
    }

    if (!formState.status) {
      nextErrors.status = 'Status is required';
    }

    return nextErrors;
  };

  const updateField = <K extends keyof AttributeOptionFormState>(
    field: K,
    value: AttributeOptionFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, root: undefined }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      return;
    }

    const payload: SystemConfigAttributeOptionDTO = {
      code: useColorCode ? formState.code.trim().toUpperCase() : formState.code.trim(),
      label: formState.label.trim(),
      sortOrder: Number(formState.sortOrder),
      status: formState.status,
      attribute: { id: attribute.id } as SystemConfigAttributeDTO,
    };

    try {
      const createdOption = await createOption({ data: payload });

      await queryClient.invalidateQueries({
        queryKey: ['/api/system-config-attribute-options'],
      });

      if (createdOption.status === SystemConfigAttributeOptionDTOStatus.ACTIVE) {
        onOptionCreated?.(createdOption);
      }

      toast.success(`${createdOption.label ?? 'Attribute option'} created successfully.`);
      setOpen(false);
    } catch (error) {
      const message = extractErrorMessage(error);

      setErrors((prev) => ({ ...prev, root: message }));
      toast.error(message);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {attributeLabel} Option</DialogTitle>
            <DialogDescription>
              Create a new option for {attributeLabel}. Active options appear in the variant
              selector immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attribute
              </p>
              <p className="text-sm font-medium text-slate-900">{attributeLabel}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`option-code-${attribute.id}`}>Code</Label>
              <div className={useColorCode ? 'flex items-center gap-3' : undefined}>
                {useColorCode && (
                  <Input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(formState.code) ? formState.code : '#000000'}
                    onChange={(event) => updateField('code', event.target.value.toUpperCase())}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                )}
                <Input
                  id={`option-code-${attribute.id}`}
                  value={formState.code}
                  onChange={(event) =>
                    updateField(
                      'code',
                      useColorCode ? event.target.value.toUpperCase() : event.target.value
                    )
                  }
                  placeholder={useColorCode ? '#FF5733' : 'OPTION_A'}
                  maxLength={50}
                  aria-invalid={Boolean(errors.code)}
                />
              </div>
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`option-label-${attribute.id}`}>Label</Label>
              <Input
                id={`option-label-${attribute.id}`}
                value={formState.label}
                onChange={(event) => updateField('label', event.target.value)}
                placeholder="Display label"
                maxLength={100}
                aria-invalid={Boolean(errors.label)}
              />
              {errors.label && <p className="text-sm text-destructive">{errors.label}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`option-sort-order-${attribute.id}`}>Sort Order</Label>
                <Input
                  id={`option-sort-order-${attribute.id}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formState.sortOrder}
                  onChange={(event) => updateField('sortOrder', event.target.value)}
                  aria-invalid={Boolean(errors.sortOrder)}
                />
                {errors.sortOrder && <p className="text-sm text-destructive">{errors.sortOrder}</p>}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    updateField('status', value as SystemConfigAttributeOptionDTOStatus)
                  }
                >
                  <SelectTrigger className="w-full" aria-invalid={Boolean(errors.status)}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SystemConfigAttributeOptionDTOStatus.ACTIVE}>
                      Active
                    </SelectItem>
                    <SelectItem value={SystemConfigAttributeOptionDTOStatus.DRAFT}>
                      Draft
                    </SelectItem>
                    <SelectItem value={SystemConfigAttributeOptionDTOStatus.INACTIVE}>
                      Inactive
                    </SelectItem>
                    <SelectItem value={SystemConfigAttributeOptionDTOStatus.ARCHIVED}>
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
              </div>
            </div>

            {errors.root && <p className="text-sm text-destructive">{errors.root}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={() => void handleSubmit()}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Option
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
