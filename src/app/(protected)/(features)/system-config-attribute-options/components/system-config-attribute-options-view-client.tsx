'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Plus, Save, Settings, X } from 'lucide-react';
import { InlinePermissionGuard } from '@/core/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateSystemConfigAttributeOption,
  useGetAllSystemConfigAttributeOptions,
  useGetSystemConfigAttributeOption,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type {
  SystemConfigAttributeDTO,
  SystemConfigAttributeOptionDTO,
} from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';

type EditableOptionDraft = Pick<SystemConfigAttributeOptionDTO, 'code' | 'label' | 'status'>;

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusBadgeVariant(
  status: SystemConfigAttributeOptionDTOStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === SystemConfigAttributeOptionDTOStatus.ACTIVE) return 'default';
  if (status === SystemConfigAttributeOptionDTOStatus.ARCHIVED) return 'destructive';
  if (status === SystemConfigAttributeOptionDTOStatus.INACTIVE) return 'outline';

  return 'secondary';
}

function buildAttributePath(attribute?: SystemConfigAttributeDTO) {
  const systemConfigKey = attribute?.systemConfig?.configKey ?? 'unknown';
  const attributeName = attribute?.name ?? attribute?.label ?? 'attribute';

  return `${systemConfigKey}.${attributeName}`;
}

function normalizeOptionCode(value: string) {
  return value.replace(/\s+/g, '_');
}

function isColorAttribute(attribute?: SystemConfigAttributeDTO) {
  const source = `${attribute?.name ?? ''} ${attribute?.label ?? ''}`.toLowerCase();

  return source.includes('color');
}

export function SystemConfigAttributeOptionsViewClient({
  id,
  scope,
}: {
  id: number;
  scope?: string;
}) {
  const queryClient = useQueryClient();
  const createOption = useCreateSystemConfigAttributeOption();
  const updateOption = useUpdateSystemConfigAttributeOption();
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditableOptionDraft | null>(null);
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [createDraft, setCreateDraft] = useState<EditableOptionDraft>({
    code: '',
    label: '',
    status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
  });
  const isGroupedScope = scope === 'attribute';

  const groupedQuery = useGetAllSystemConfigAttributeOptions(
    {
      'attributeId.equals': id,
      page: 0,
      size: 5000,
      sort: ['sortOrder,asc', 'id,asc'],
    },
    {
      query: {
        enabled: isGroupedScope,
        staleTime: 60_000,
      },
    }
  );

  const groupedOptions = groupedQuery.data ?? [];
  const shouldFallbackToSingle = !isGroupedScope || (groupedQuery.isFetched && groupedOptions.length === 0);

  const singleQuery = useGetSystemConfigAttributeOption(id, {
    query: {
      enabled: shouldFallbackToSingle,
      staleTime: 60_000,
    },
  });

  const options = useMemo(() => {
    if (isGroupedScope && groupedOptions.length > 0) {
      return groupedOptions;
    }

    return singleQuery.data ? [singleQuery.data] : [];
  }, [groupedOptions, isGroupedScope, singleQuery.data]);

  const isLoading =
    (isGroupedScope && groupedQuery.isLoading) || (!options.length && singleQuery.isLoading);
  const hasError = Boolean(
    (isGroupedScope && groupedQuery.error && groupedOptions.length === 0) || singleQuery.error
  );
  const isGroupedView = isGroupedScope && groupedOptions.length > 0;
  const currentAttribute = options[0]?.attribute;
  const attributePath = buildAttributePath(currentAttribute);
  const showColorPicker = isColorAttribute(currentAttribute);

  const startEditing = (option: SystemConfigAttributeOptionDTO) => {
    if (!option.id) {
      return;
    }

    setIsCreatingRow(false);
    setEditingOptionId(option.id);
    setDraft({
      code: option.code,
      label: option.label,
      status: option.status,
    });
  };

  const cancelEditing = () => {
    setEditingOptionId(null);
    setDraft(null);
  };

  const startCreating = () => {
    if (!currentAttribute?.id) {
      return;
    }

    cancelEditing();
    setCreateDraft({
      code: '',
      label: '',
      status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
    });
    setIsCreatingRow(true);
  };

  const cancelCreating = () => {
    setIsCreatingRow(false);
    setCreateDraft({
      code: '',
      label: '',
      status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
    });
  };

  const updateDraft = <K extends keyof EditableOptionDraft>(
    field: K,
    value: EditableOptionDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateCreateDraft = <K extends keyof EditableOptionDraft>(
    field: K,
    value: EditableOptionDraft[K]
  ) => {
    setCreateDraft((current) => ({ ...current, [field]: value }));
  };

  const saveOption = async (option: SystemConfigAttributeOptionDTO) => {
    if (!option.id || !draft) {
      return;
    }

    try {
      await updateOption.mutateAsync({
        id: option.id,
        data: {
          ...option,
          ...draft,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/system-config-attribute-options'] }),
        queryClient.invalidateQueries({
          queryKey: [`/api/system-config-attribute-options/${option.id}`],
        }),
      ]);

      toast.success('Attribute option updated successfully');
      cancelEditing();
    } catch (error) {
      console.error('Failed to update attribute option', error);
      toast.error('Failed to update attribute option');
    }
  };

  const saveNewOption = async () => {
    if (!currentAttribute?.id) {
      return;
    }

    const normalizedCode = normalizeOptionCode(createDraft.code.trim());
    const trimmedLabel = createDraft.label.trim();

    if (!normalizedCode) {
      toast.error('Option code is required');
      return;
    }

    if (!trimmedLabel) {
      toast.error('Option label is required');
      return;
    }

    try {
      const nextSortOrder =
        options.reduce(
          (maxSortOrder, option) => Math.max(maxSortOrder, option.sortOrder ?? 0),
          0
        ) + 1;

      await createOption.mutateAsync({
        data: {
          attribute: { id: currentAttribute.id } as SystemConfigAttributeDTO,
          code: normalizedCode,
          label: trimmedLabel,
          status: createDraft.status,
          sortOrder: nextSortOrder,
        } as SystemConfigAttributeOptionDTO,
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/system-config-attribute-options'] });
      toast.success('Attribute option created successfully');
      cancelCreating();
    } catch (error) {
      console.error('Failed to create attribute option', error);
      toast.error('Failed to create attribute option');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading attribute option details...
      </div>
    );
  }

  if (hasError || options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribute Option Not Found</CardTitle>
          <CardDescription>
            The requested attribute option details could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/system-config-attribute-options">Back to Attribute Options</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                {isGroupedView ? attributePath : options[0]?.label}
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                {isGroupedView
                  ? `Viewing all options for ${attributePath}.`
                  : 'Viewing attribute option details in table form.'}
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            {isGroupedView && currentAttribute?.id ? (
              <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:create">
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                  onClick={startCreating}
                  disabled={isCreatingRow || createOption.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Option</span>
                </Button>
              </InlinePermissionGuard>
            ) : null}
          </div>

          <div className="flex-1 flex justify-end">
            <Button asChild variant="outline" className="bg-white/80">
              <Link href="/system-config-attribute-options">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {options.length} {options.length === 1 ? 'option' : 'options'}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">ID</TableHead>
              <TableHead>Attribute</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[90px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCreatingRow && currentAttribute ? (
              <TableRow>
                <TableCell className="font-medium">New</TableCell>
                <TableCell>{buildAttributePath(currentAttribute)}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  {showColorPicker ? (
                    <ColorPicker
                      value={createDraft.code || '#000000'}
                      onChange={(value) => updateCreateDraft('code', value)}
                    />
                  ) : (
                    <Input
                      value={createDraft.code}
                      onChange={(event) =>
                        updateCreateDraft('code', normalizeOptionCode(event.target.value))
                      }
                      placeholder="OPTION_CODE"
                    />
                  )}
                </TableCell>
                <TableCell className="whitespace-normal break-words">
                  <Input
                    value={createDraft.label}
                    onChange={(event) => updateCreateDraft('label', event.target.value)}
                    placeholder="Display value"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={createDraft.status}
                    onValueChange={(value) =>
                      updateCreateDraft('status', value as SystemConfigAttributeOptionDTOStatus)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SystemConfigAttributeOptionDTOStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {transformEnumValue(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={saveNewOption}
                      disabled={createOption.isPending}
                    >
                      {createOption.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="sr-only">Save new option</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={cancelCreating}
                      disabled={createOption.isPending}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel creating option</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {options.map((option) => (
              <TableRow key={`${option.attribute?.id ?? 'attribute'}-${option.id ?? option.code}`}>
                <TableCell className="font-medium">{option.id ?? '-'}</TableCell>
                <TableCell>{buildAttributePath(option.attribute)}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  {editingOptionId === option.id && draft ? (
                    showColorPicker ? (
                      <ColorPicker
                        value={draft.code || '#000000'}
                        onChange={(value) => updateDraft('code', value)}
                      />
                    ) : (
                      <Input
                        value={draft.code}
                        onChange={(event) =>
                          updateDraft('code', normalizeOptionCode(event.target.value))
                        }
                      />
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      {showColorPicker && /^#[0-9A-Fa-f]{6}$/.test(option.code) ? (
                        <div
                          className="h-5 w-5 rounded border border-gray-300"
                          style={{ backgroundColor: option.code }}
                        />
                      ) : null}
                      <span>{option.code}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal break-words">
                  {editingOptionId === option.id && draft ? (
                    <Input
                      value={draft.label}
                      onChange={(event) => updateDraft('label', event.target.value)}
                    />
                  ) : (
                    option.label
                  )}
                </TableCell>
                <TableCell>
                  {editingOptionId === option.id && draft ? (
                    <Select
                      value={draft.status}
                      onValueChange={(value) =>
                        updateDraft('status', value as SystemConfigAttributeOptionDTOStatus)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SystemConfigAttributeOptionDTOStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {transformEnumValue(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusBadgeVariant(option.status)}>
                      {transformEnumValue(option.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:update">
                    {editingOptionId === option.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => saveOption(option)}
                          disabled={updateOption.isPending}
                        >
                          {updateOption.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="sr-only">Save {option.label}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={cancelEditing}
                          disabled={updateOption.isPending}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel editing {option.label}</span>
                        </Button>
                      </div>
                    ) : option.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => startEditing(option)}
                        disabled={isCreatingRow}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {option.label}</span>
                      </Button>
                    ) : null}
                  </InlinePermissionGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
