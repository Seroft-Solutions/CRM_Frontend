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
 * @property {boolean} isLoadingOptions - Flag indicating if attribute options are being loaded.
 * @property {EnumAttributeWithOptions[]} enumAttributeOptions - A list of all ENUM attributes paired with their options.
 * @property {Record<number, Set<number>>} selectedOptionIdsByAttributeId - A map of selected option IDs for each attribute ID.
 * @property {SystemConfigAttributeDTO[]} visibleEnumAttributes - A sorted list of ENUM attributes to be displayed.
 * @property {() => void} onSave - The callback function to trigger saving the draft variants.
 * @property {boolean} isSaving - A flag indicating if the save operation is in progress.
 * @property {boolean} canSave - A flag indicating if saving is currently allowed.
 * @property {(attributeId: number, optionId: number) => void} onToggleOption - The callback function to toggle the selection state of an option.
 */
interface VariantGeneratorProps {
  newVariantsCount: number;
  duplicateVariantsCount: number;
  missingRequiredEnumAttributes: SystemConfigAttributeDTO[];
  isLoadingSelections: boolean;
  isLoadingOptions: boolean;
  enumAttributeOptions: EnumAttributeWithOptions[];
  selectedOptionIdsByAttributeId: Record<number, Set<number>>;
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
  onToggleOption: (attributeId: number, optionId: number) => void;
  disabledOptionIds: Set<number>;
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
  isLoadingOptions,
  enumAttributeOptions,
  selectedOptionIdsByAttributeId,
  visibleEnumAttributes,
  onSave,
  isSaving,
  canSave,
  onToggleOption,
  disabledOptionIds,
}: VariantGeneratorProps) {
  return (
    <div className="rounded-xl border-2 border-primary/10 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm p-6 space-y-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <VariantGeneratorHeader
        newVariantsCount={newVariantsCount}
        duplicateVariantsCount={duplicateVariantsCount}
        missingRequiredCount={missingRequiredEnumAttributes.length}
        onSave={onSave}
        isSaving={isSaving}
        canSave={canSave}
      />

      {missingRequiredEnumAttributes.length > 0 && (
        <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
          <AlertDescription className="text-amber-800 font-medium">
            <span className="font-semibold">Required selections missing:</span>{' '}
            {missingRequiredEnumAttributes
              .map((a) => a.label ?? a.name)
              .join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {isLoadingSelections && (
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-400">
          <AlertDescription className="text-blue-800 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading existing variant selections… duplicate prevention will activate once complete.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {visibleEnumAttributes.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            No ENUM attributes found for this configuration.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add ENUM-type attributes to enable variant generation.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleEnumAttributes.map((attr) => {
            const attributeId = attr.id!;
            const options = enumAttributeOptions.find((x) => x.attribute.id === attributeId)?.options ?? [];
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

      {visibleEnumAttributes.length > 0 && !isLoadingOptions && missingRequiredEnumAttributes.length === 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-primary font-bold">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Select options for just one attribute to create partial variants, or combine multiple attributes for full combinations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
