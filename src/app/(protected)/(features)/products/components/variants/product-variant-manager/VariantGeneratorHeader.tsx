import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * @interface VariantGeneratorHeaderProps
 * @description Props for the VariantGeneratorHeader component.
 * @property {number} draftVariantsCount - The number of draft variants currently generated.
 * @property {number} missingRequiredCount - The number of required attributes that are missing a selection.
 * @property {() => void} onSave - The callback function to execute when the save button is clicked.
 * @property {boolean} isSaving - A flag indicating whether the save operation is in progress.
 * @property {boolean} canSave - A flag indicating whether the save button should be enabled.
 */
interface VariantGeneratorHeaderProps {
  draftVariantsCount: number;
  missingRequiredCount: number;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}

/**
 * @component VariantGeneratorHeader
 * @description The header for the variant generator section. It displays the title, summary badges
 * (generated count, missing required selections), and the main save button.
 * @param {VariantGeneratorHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered header.
 */
export function VariantGeneratorHeader({
  draftVariantsCount,
  missingRequiredCount,
  onSave,
  isSaving,
  canSave,
}: VariantGeneratorHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Create Variants</h3>
          <Badge
            variant={draftVariantsCount > 0 ? 'default' : 'secondary'}
            className={
              draftVariantsCount > 0
                ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90'
                : 'text-foreground'
            }
          >
            {draftVariantsCount} generated
          </Badge>
          {missingRequiredCount > 0 && (
            <Badge className="bg-sidebar text-sidebar-foreground border-sidebar-border/60">
              {missingRequiredCount} missing
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Click attribute options to generate combinations, edit fields inline, then save.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={isSaving || !canSave}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Save {draftVariantsCount} Variant{draftVariantsCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
