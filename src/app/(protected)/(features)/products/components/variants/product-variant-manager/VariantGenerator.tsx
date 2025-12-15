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
 * @property {number} draftVariantsCount - The number of generated draft variants.
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
  draftVariantsCount: number;
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
}

/**
 * @component VariantGenerator
 * @description This component provides the main UI for generating product variants. It includes a header with actions,
 * alerts for missing selections, and a grid of attribute selectors.
 * @param {VariantGeneratorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered variant generator section.
 */
export function VariantGenerator({
  draftVariantsCount,
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
}: VariantGeneratorProps) {
  return (
    <div className="rounded-md border bg-muted/20 p-4 space-y-4">
      <VariantGeneratorHeader
        draftVariantsCount={draftVariantsCount}
        missingRequiredCount={missingRequiredEnumAttributes.length}
        onSave={onSave}
        isSaving={isSaving}
        canSave={canSave}
      />

      {missingRequiredEnumAttributes.length > 0 && (
        <Alert>
          <AlertDescription>
            Missing required selections: {missingRequiredEnumAttributes
              .map((a) => a.label ?? a.name)
              .join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {isLoadingSelections && (
        <Alert>
          <AlertDescription>
            Loading existing variant selections… duplicate prevention by attribute options will run once loading finishes.
          </AlertDescription>
        </Alert>
      )}

      {visibleEnumAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No ENUM attributes found for this configuration.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              />
            );
          })}
        </div>
      )}

      {visibleEnumAttributes.length > 0 && !isLoadingOptions && missingRequiredEnumAttributes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Tip: You can select options for only one attribute to generate partial variants.
        </p>
      )}
    </div>
  );
}
