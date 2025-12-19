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
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Create Variants</h3>
          </div>
          <Badge
            variant={draftVariantsCount > 0 ? 'default' : 'secondary'}
            className={`font-semibold px-3 py-1 transition-all duration-200 ${
              draftVariantsCount > 0
                ? 'bg-gradient-to-r from-sidebar-accent to-sidebar-accent/90 text-sidebar-accent-foreground hover:from-sidebar-accent/90 hover:to-sidebar-accent shadow-md hover:shadow-lg'
                : 'text-foreground bg-muted hover:bg-muted/80'
            }`}
          >
            {draftVariantsCount} generated
          </Badge>
          {missingRequiredCount > 0 && (
            <Badge className="bg-gradient-to-r from-destructive/10 to-destructive/20 text-destructive border-destructive/30 font-semibold px-3 py-1 shadow-sm">
              {missingRequiredCount} missing
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select attribute options below to generate variant combinations. Edit prices and stock inline, then save your changes.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={isSaving || !canSave}
          size="lg"
          className={`font-semibold px-6 transition-all duration-200 ${
            canSave
              ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 mr-2" />
          )}
          Save {draftVariantsCount} Variant{draftVariantsCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
