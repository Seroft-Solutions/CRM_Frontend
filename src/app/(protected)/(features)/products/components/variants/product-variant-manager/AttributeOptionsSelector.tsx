import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTO';

/**
 * @interface AttributeOptionsSelectorProps
 * @description Props for the AttributeOptionsSelector component.
 * @property {SystemConfigAttributeDTO} attribute - The attribute for which to display options.
 * @property {SystemConfigAttributeOptionDTO[]} options - The list of available options for the attribute.
 * @property {Set<number>} selectedOptionIds - A set of currently selected option IDs for this attribute.
 * @property {(attributeId: number, optionId: number) => void} onToggleOption - Callback fired when an option button is clicked.
 */
interface AttributeOptionsSelectorProps {
  attribute: SystemConfigAttributeDTO;
  options: SystemConfigAttributeOptionDTO[];
  selectedOptionIds: Set<number>;
  onToggleOption: (attributeId: number, optionId: number) => void;
  disabledOptionIds: Set<number>;
}

/**
 * @component AttributeOptionsSelector
 * @description A component that displays a single attribute and its available options as selectable buttons.
 * It shows whether the attribute is required and how many options are currently selected.
 * @param {AttributeOptionsSelectorProps} props - The props for the component.
 * @returns {JSX.Element} The rendered attribute selector.
 */
export function AttributeOptionsSelector({
  attribute,
  options,
  selectedOptionIds,
  onToggleOption,
  disabledOptionIds,
}: AttributeOptionsSelectorProps) {
  const attributeId = attribute.id!;

  return (
    <div className="rounded-md border bg-background p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{attribute.label ?? attribute.name}</p>
          <div className="flex items-center gap-2">
            {attribute.isRequired && (
              <Badge
                className={
                  selectedOptionIds.size > 0
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-transparent'
                    : 'bg-sidebar text-sidebar-foreground border-sidebar-border/60'
                }
              >
                Required
              </Badge>
            )}
            <Badge variant="secondary" className="text-foreground">
              {selectedOptionIds.size} selected
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const optId = opt.id;
          if (typeof optId !== 'number') return null;
          const isSelected = selectedOptionIds.has(optId);
          const isDisabled = disabledOptionIds.has(optId) && !isSelected;
          const label = opt.label ?? opt.code ?? '';
          return (
            <Button
              key={optId}
              type="button"
              size="sm"
              variant={isSelected ? 'default' : 'outline'}
              className={
                isSelected
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90'
                  : 'text-foreground hover:bg-sidebar-accent/10'
              }
              aria-pressed={isSelected}
              onClick={() => onToggleOption(attributeId, optId)}
              disabled={isDisabled}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
