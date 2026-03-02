import { Alert, AlertDescription } from '@/components/ui/alert';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTO';
import { AttributeOptionsSelector } from './AttributeOptionsSelector';
import { VariantGeneratorHeader } from './VariantGeneratorHeader';

/**
 * @interface EnumAttributeWithOptions
 * @description A helper interface that pairs an attribute with its list of options.
 * @property {SystemConfigAttributeDTO} attribute - The system config attribute.
 * @property {SystemConfigAttributeOptionDTO[]} options - The array of options for the attribute.
 */
interface EnumAttributeWithOptions {
  attribute: SystemConfigAttributeDTO;
  options: SystemConfigAttributeOptionDTO[];
}

/**
 * @interface VariantGeneratorProps
 * @description Props for the VariantGenerator component.
 * @property {number} newVariantsCount - The number of new variants that will be created.
 * @property {number} duplicateVariantsCount - The number of duplicate variants that already exist.
 * @property {SystemConfigAttributeDTO[]} missingRequiredEnumAttributes - A list of required attributes that have no selected options.
 * @property {boolean} isLoadingSelections - Flag indicating if existing variant selections are being loaded.
 * @property {EnumAttributeWithOptions[]} enumAttributeOptions - A list of all ENUM attributes paired with their options.
 * @property {Record<number, Set<number>>} selectedOptionIdsByAttributeId - A map of selected option IDs for each attribute ID.
 * @property {SystemConfigAttributeDTO[]} visibleEnumAttributes - A sorted list of ENUM attributes to be displayed.
 * @property {() => void} onSave - The callback function to trigger saving the draft variants.
 * @property {boolean} isSaving - A flag indicating if the save operation is in progress.
 * @property {boolean} canSave - A flag indicating if saving is currently allowed.
 * @property {(attributeId: number, optionId: number) => void} onToggleOption - The callback function to toggle the selection state of an option.
 * @property {boolean} isCreateMode - Flag indicating if in create mode (no productId).
 */
interface VariantGeneratorProps {
  newVariantsCount: number;
  duplicateVariantsCount: number;
  missingRequiredEnumAttributes: SystemConfigAttributeDTO[];
  isLoadingSelections: boolean;
  enumAttributeOptions: EnumAttributeWithOptions[];
  selectedOptionIdsByAttributeId: Record<number, Set<number>>;
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  onToggleOption: (attributeId: number, optionId: number) => void;
  disabledOptionIds: Set<number>;
  isCreateMode?: boolean;
}

/**
 * @component VariantGenerator
 * @description This component provides the main UI for generating product variants. It includes a header with actions,
 * alerts for missing selections, and a grid of attribute selectors.
 * @param {VariantGeneratorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered variant generator section.
 */
export function VariantGenerator({
  newVariantsCount,
  duplicateVariantsCount,
  missingRequiredEnumAttributes,
  isLoadingSelections,
  enumAttributeOptions,
  selectedOptionIdsByAttributeId,
  visibleEnumAttributes,
  onToggleOption,
  disabledOptionIds,
  isCreateMode = false,
}: VariantGeneratorProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <VariantGeneratorHeader
        newVariantsCount={newVariantsCount}
        duplicateVariantsCount={duplicateVariantsCount}
        missingRequiredCount={missingRequiredEnumAttributes.length}
        isCreateMode={isCreateMode}
      />

      {isLoadingSelections && (
        <Alert className="border-blue-200 bg-blue-50 border-l-4 border-l-blue-500 py-2">
          <AlertDescription className="text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading existing variant selections...</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {visibleEnumAttributes.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm font-medium">No ENUM attributes found for this configuration.</p>
          <p className="text-xs mt-1">Add ENUM-type attributes to enable variant generation.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleEnumAttributes.map((attr) => {
            const attributeId = attr.id!;
            const options =
              enumAttributeOptions.find((x) => x.attribute.id === attributeId)?.options ?? [];
            const selectedSet = selectedOptionIdsByAttributeId[attributeId] ?? new Set<number>();

            return (
              <AttributeOptionsSelector
                key={attributeId}
                attribute={attr}
                options={options}
                selectedOptionIds={selectedSet}
                onToggleOption={onToggleOption}
                disabledOptionIds={disabledOptionIds}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
