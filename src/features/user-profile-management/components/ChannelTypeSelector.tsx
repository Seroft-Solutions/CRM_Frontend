/**
 * Channel Type Selector with Channel Party cascading
 */
import { PaginatedRelationshipCombobox } from '@/app/(protected)/calls/components/paginated-relationship-combobox';
import {
  useGetAllChannelTypes,
  useCountChannelTypes,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import {
  useGetAllUserProfiles,
  useCountUserProfiles,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface ChannelTypeSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
}

interface ChannelPartySelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  channelTypeId?: number;
  disabled?: boolean;
  className?: string;
}

interface CascadingChannelSelectorsProps {
  form: any;
  channelTypeFieldName?: string;
  channelPartyFieldName?: string;
  disabled?: boolean;
}

export function ChannelTypeSelector({
  value,
  onValueChange,
  disabled = false,
  className,
}: ChannelTypeSelectorProps) {
  return (
    <PaginatedRelationshipCombobox
      value={value}
      onValueChange={onValueChange}
      displayField="name"
      placeholder="Select channel type..."
      disabled={disabled}
      className={className}
      useGetAllHook={useGetAllChannelTypes}
      useCountHook={useCountChannelTypes}
      entityName="ChannelTypes"
      searchField="name"
      canCreate={true}
      createEntityPath="/channel-types/new"
      createPermission="channelType:create"
    />
  );
}

export function ChannelPartySelector({
  value,
  onValueChange,
  channelTypeId,
  disabled = false,
  className,
}: ChannelPartySelectorProps) {
  return (
    <PaginatedRelationshipCombobox
      value={value}
      onValueChange={onValueChange}
      displayField="email"
      placeholder="Select channel party..."
      disabled={disabled || !channelTypeId}
      className={className}
      useGetAllHook={useGetAllUserProfiles}
      useCountHook={useCountUserProfiles}
      entityName="UserProfiles"
      searchField="email"
      canCreate={true}
      createEntityPath="/user-profiles/new"
      createPermission="userProfile:create"
      parentFilter={channelTypeId}
      parentField="channelType"
    />
  );
}

export function CascadingChannelSelectors({
  form,
  channelTypeFieldName = 'channelType',
  channelPartyFieldName = 'channelParty',
  disabled = false,
}: CascadingChannelSelectorsProps) {
  const handleEntityCreated = (entityId: number, relationshipName: string) => {
    form.setValue(relationshipName, entityId);
    form.trigger(relationshipName);
  };

  return (
    <>
      <FormField
        control={form.control}
        name={channelTypeFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Channel Type</FormLabel>
            <FormControl>
              <PaginatedRelationshipCombobox
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Clear channel party when channel type changes
                  form.setValue(channelPartyFieldName, undefined);
                }}
                displayField="name"
                placeholder="Select channel type"
                disabled={disabled}
                useGetAllHook={useGetAllChannelTypes}
                useCountHook={useCountChannelTypes}
                entityName="ChannelTypes"
                searchField="name"
                canCreate={true}
                createEntityPath="/channel-types/new"
                createPermission="channelType:create"
                onEntityCreated={(entityId) => handleEntityCreated(entityId, channelTypeFieldName)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={channelPartyFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Channel Party</FormLabel>
            <FormControl>
              <PaginatedRelationshipCombobox
                value={field.value}
                onValueChange={field.onChange}
                displayField="email"
                placeholder="Select channel party"
                disabled={disabled || !form.watch(channelTypeFieldName)}
                useGetAllHook={useGetAllUserProfiles}
                useCountHook={useCountUserProfiles}
                entityName="UserProfiles"
                searchField="email"
                canCreate={true}
                createEntityPath="/user-profiles/new"
                createPermission="userProfile:create"
                onEntityCreated={(entityId) => handleEntityCreated(entityId, channelPartyFieldName)}
                parentFilter={form.watch(channelTypeFieldName)}
                parentField="channelType"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
