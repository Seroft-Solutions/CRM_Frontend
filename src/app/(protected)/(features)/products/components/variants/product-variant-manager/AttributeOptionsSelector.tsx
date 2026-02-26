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
  const isColorAttribute =
    attribute.name?.toLowerCase() === 'color' || attribute.label?.toLowerCase() === 'color';

  const resolveColorCode = (option: SystemConfigAttributeOptionDTO) => {
    const code = option.code?.trim();

    if (!code) return undefined;

    return /^#[0-9a-fA-F]{6}$/.test(code) ? code : undefined;
  };

  const resolveReadableTextColor = (hex: string) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#111827' : '#FFFFFF';
  };

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-4 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {attribute.label ?? attribute.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {attribute.isRequired && (
              <Badge
                className={
                  selectedOptionIds.size > 0
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-transparent shadow-sm animate-in fade-in-0 zoom-in-95'
                    : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                }
              >
                Required
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs font-medium transition-colors ${
                selectedOptionIds.size > 0
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
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
          const colorCode = isColorAttribute ? resolveColorCode(opt) : undefined;
          const textColor = colorCode ? resolveReadableTextColor(colorCode) : undefined;

          return (
            <Button
              key={optId}
              type="button"
              size="sm"
              variant={isSelected && !colorCode ? 'default' : 'outline'}
              className={`relative overflow-hidden transition-all duration-200 transform hover:scale-105 ${
                isSelected
                  ? colorCode
                    ? 'border-transparent shadow-md hover:shadow-lg ring-2 ring-offset-2 ring-sidebar-accent'
                    : 'bg-gradient-to-r from-sidebar-accent to-sidebar-accent/90 text-sidebar-accent-foreground border-transparent shadow-md hover:shadow-lg hover:from-sidebar-accent/90 hover:to-sidebar-accent'
                  : isDisabled
                    ? 'opacity-50 cursor-not-allowed border-muted text-muted-foreground'
                    : 'text-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm'
              } ${isSelected ? (colorCode ? '' : 'ring-2 ring-sidebar-accent/20') : ''}`}
              style={
                colorCode
                  ? {
                      backgroundColor: colorCode,
                      borderColor: colorCode,
                      color: textColor,
                    }
                  : undefined
              }
              aria-pressed={isSelected}
              onClick={() => !isDisabled && onToggleOption(attributeId, optId)}
              disabled={isDisabled}
            >
              <span className="relative z-10 font-medium">{label}</span>
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
