'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Plus, Save, Settings, X } from 'lucide-react';
import { InlinePermissionGuard } from '@/core/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateSystemConfigAttribute,
  useGetAllSystemConfigAttributes,
  useGetSystemConfigAttribute,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import type { SystemConfigAttributeDTO, SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';

type EditableAttributeDraft = Pick<
  SystemConfigAttributeDTO,
  'name' | 'label' | 'isRequired' | 'status'
>;

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusBadgeVariant(
  status: SystemConfigAttributeDTOStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === SystemConfigAttributeDTOStatus.ACTIVE) return 'default';
  if (status === SystemConfigAttributeDTOStatus.ARCHIVED) return 'destructive';
  if (status === SystemConfigAttributeDTOStatus.INACTIVE) return 'outline';

  return 'secondary';
}

function normalizeAttributeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function SystemConfigAttributesViewClient({
  id,
  scope,
}: {
  id: number;
  scope?: string;
}) {
  const queryClient = useQueryClient();
  const createAttribute = useCreateSystemConfigAttribute();
  const updateAttribute = useUpdateSystemConfigAttribute();
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditableAttributeDraft | null>(null);
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [createDraft, setCreateDraft] = useState<EditableAttributeDraft>({
    name: '',
    label: '',
    isRequired: false,
    status: SystemConfigAttributeDTOStatus.ACTIVE,
  });
  const isGroupedScope = scope === 'system-config';

  const groupedQuery = useGetAllSystemConfigAttributes(
    {
      'systemConfigId.equals': id,
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

  const groupedAttributes = groupedQuery.data ?? [];
  const shouldFallbackToSingle = !isGroupedScope || (groupedQuery.isFetched && groupedAttributes.length === 0);

  const singleQuery = useGetSystemConfigAttribute(id, {
    query: {
      enabled: shouldFallbackToSingle,
      staleTime: 60_000,
    },
  });

  const attributes = useMemo(() => {
    if (isGroupedScope && groupedAttributes.length > 0) {
      return groupedAttributes;
    }

    return singleQuery.data ? [singleQuery.data] : [];
  }, [groupedAttributes, isGroupedScope, singleQuery.data]);

  const isLoading =
    (isGroupedScope && groupedQuery.isLoading) || (!attributes.length && singleQuery.isLoading);
  const hasError = Boolean(
    (isGroupedScope && groupedQuery.error && groupedAttributes.length === 0) || singleQuery.error
  );
  const isGroupedView = isGroupedScope && groupedAttributes.length > 0;
  const systemConfigKey =
    attributes[0]?.systemConfig?.configKey ??
    (isGroupedView ? `System Config ${id}` : 'Config Attribute');
  const currentSystemConfig = attributes[0]?.systemConfig;

  const startEditing = (attribute: SystemConfigAttributeDTO) => {
    if (!attribute.id) {
      return;
    }

    setIsCreatingRow(false);
    setEditingAttributeId(attribute.id);
    setDraft({
      name: attribute.name,
      label: attribute.label,
      isRequired: attribute.isRequired,
      status: attribute.status,
    });
  };

  const cancelEditing = () => {
    setEditingAttributeId(null);
    setDraft(null);
  };

  const startCreating = () => {
    if (!currentSystemConfig?.id) {
      return;
    }

    cancelEditing();
    setCreateDraft({
      name: '',
      label: '',
      isRequired: false,
      status: SystemConfigAttributeDTOStatus.ACTIVE,
    });
    setIsCreatingRow(true);
  };

  const cancelCreating = () => {
    setIsCreatingRow(false);
    setCreateDraft({
      name: '',
      label: '',
      isRequired: false,
      status: SystemConfigAttributeDTOStatus.ACTIVE,
    });
  };

  const updateDraft = <K extends keyof EditableAttributeDraft>(
    field: K,
    value: EditableAttributeDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateCreateDraft = <K extends keyof EditableAttributeDraft>(
    field: K,
    value: EditableAttributeDraft[K]
  ) => {
    setCreateDraft((current) => ({ ...current, [field]: value }));
  };

  const saveAttribute = async (attribute: SystemConfigAttributeDTO) => {
    if (!attribute.id || !draft) {
      return;
    }

    try {
      await updateAttribute.mutateAsync({
        id: attribute.id,
        data: {
          ...attribute,
          ...draft,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/system-config-attributes'] }),
        queryClient.invalidateQueries({
          queryKey: [`/api/system-config-attributes/${attribute.id}`],
        }),
      ]);

      toast.success('Config attribute updated successfully');
      cancelEditing();
    } catch (error) {
      console.error('Failed to update config attribute', error);
      toast.error('Failed to update config attribute');
    }
  };

  const saveNewAttribute = async () => {
    if (!currentSystemConfig?.id) {
      return;
    }

    const normalizedName = normalizeAttributeKey(createDraft.name);
    const trimmedLabel = createDraft.label.trim();

    if (!normalizedName) {
      toast.error('Attribute key is required');
      return;
    }

    if (!trimmedLabel) {
      toast.error('Value is required');
      return;
    }

    try {
      const nextSortOrder =
        attributes.reduce((maxSortOrder, attribute) => Math.max(maxSortOrder, attribute.sortOrder ?? 0), 0) + 1;

      await createAttribute.mutateAsync({
        data: {
          systemConfig: {
            id: currentSystemConfig.id,
          } as SystemConfigDTO,
          name: normalizedName,
          label: trimmedLabel,
          isRequired: createDraft.isRequired,
          status: createDraft.status,
          attributeType: SystemConfigAttributeDTOAttributeType.ENUM,
          sortOrder: nextSortOrder,
        } as SystemConfigAttributeDTO,
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/system-config-attributes'] });
      toast.success('Config attribute created successfully');
      cancelCreating();
    } catch (error) {
      console.error('Failed to create config attribute', error);
      toast.error('Failed to create config attribute');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading attribute details...
      </div>
    );
  }

  if (hasError || attributes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Config Attribute Not Found</CardTitle>
          <CardDescription>
            The requested config attribute details could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/system-config-attributes">Back to Config Attributes</Link>
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
                {isGroupedView ? systemConfigKey : attributes[0]?.label}
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                {isGroupedView
                  ? `Viewing all attributes for ${systemConfigKey}.`
                  : 'Viewing config attribute details in table form.'}
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            {isGroupedView && currentSystemConfig?.id ? (
              <InlinePermissionGuard requiredPermission="systemConfigAttribute:create">
                <Button
                  variant="default"
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                  onClick={startCreating}
                  disabled={isCreatingRow || createAttribute.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Attribute</span>
                </Button>
              </InlinePermissionGuard>
            ) : null}
          </div>

          <div className="flex-1 flex justify-end">
            <Button asChild variant="outline" className="bg-white/80">
              <Link href="/system-config-attributes">
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
            {attributes.length} {attributes.length === 1 ? 'attribute' : 'attributes'}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">ID</TableHead>
              <TableHead>System Config</TableHead>
              <TableHead>Attribute Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[90px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCreatingRow && currentSystemConfig ? (
              <TableRow>
                <TableCell className="font-medium">New</TableCell>
                <TableCell>{currentSystemConfig.configKey ?? '-'}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  <Input
                    value={createDraft.name}
                    onChange={(event) =>
                      updateCreateDraft('name', normalizeAttributeKey(event.target.value))
                    }
                    placeholder="attribute_key"
                  />
                </TableCell>
                <TableCell className="whitespace-normal break-words">
                  <Input
                    value={createDraft.label}
                    onChange={(event) => updateCreateDraft('label', event.target.value)}
                    placeholder="Display value"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={createDraft.isRequired}
                      onCheckedChange={(checked) =>
                        updateCreateDraft('isRequired', checked === true)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={createDraft.status}
                    onValueChange={(value) =>
                      updateCreateDraft('status', value as SystemConfigAttributeDTOStatus)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SystemConfigAttributeDTOStatus).map((status) => (
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
                      onClick={saveNewAttribute}
                      disabled={createAttribute.isPending}
                    >
                      {createAttribute.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="sr-only">Save new attribute</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={cancelCreating}
                      disabled={createAttribute.isPending}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel creating attribute</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {attributes.map((attribute) => (
              <TableRow
                key={`${attribute.systemConfig?.id ?? 'attribute'}-${attribute.id ?? attribute.name}`}
              >
                <TableCell className="font-medium">{attribute.id ?? '-'}</TableCell>
                <TableCell>{attribute.systemConfig?.configKey ?? '-'}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  {editingAttributeId === attribute.id && draft ? (
                    <Input
                      value={draft.name}
                      onChange={(event) => updateDraft('name', event.target.value)}
                    />
                  ) : (
                    attribute.name
                  )}
                </TableCell>
                <TableCell className="whitespace-normal break-words">
                  {editingAttributeId === attribute.id && draft ? (
                    <Input
                      value={draft.label}
                      onChange={(event) => updateDraft('label', event.target.value)}
                    />
                  ) : (
                    attribute.label
                  )}
                </TableCell>
                <TableCell>
                  {editingAttributeId === attribute.id && draft ? (
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={draft.isRequired}
                        onCheckedChange={(checked) => updateDraft('isRequired', checked === true)}
                      />
                    </div>
                  ) : (
                    <Badge variant={attribute.isRequired ? 'default' : 'outline'}>
                      {attribute.isRequired ? 'Yes' : 'No'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingAttributeId === attribute.id && draft ? (
                    <Select
                      value={draft.status}
                      onValueChange={(value) =>
                        updateDraft('status', value as SystemConfigAttributeDTOStatus)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SystemConfigAttributeDTOStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {transformEnumValue(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusBadgeVariant(attribute.status)}>
                      {transformEnumValue(attribute.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <InlinePermissionGuard requiredPermission="systemConfigAttribute:update">
                    {editingAttributeId === attribute.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => saveAttribute(attribute)}
                          disabled={updateAttribute.isPending}
                        >
                          {updateAttribute.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="sr-only">Save {attribute.label}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={cancelEditing}
                          disabled={updateAttribute.isPending}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel editing {attribute.label}</span>
                        </Button>
                      </div>
                    ) : attribute.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => startEditing(attribute)}
                        disabled={isCreatingRow}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {attribute.label}</span>
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
