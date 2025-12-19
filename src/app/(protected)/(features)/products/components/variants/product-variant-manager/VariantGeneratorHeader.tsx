import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * @interface VariantGeneratorHeaderProps
 * @description Props for the VariantGeneratorHeader component.
 * @property {number} newVariantsCount - The number of new variants that will be created.
 * @property {number} duplicateVariantsCount - The number of duplicate variants that already exist.
 * @property {number} missingRequiredCount - The number of required attributes that are missing a selection.
 * @property {() => void} onSave - The callback function to execute when the save button is clicked.
 * @property {boolean} isSaving - A flag indicating whether the save operation is in progress.
 * @property {boolean} canSave - A flag indicating whether the save button should be enabled.
 */
interface VariantGeneratorHeaderProps {
  newVariantsCount: number;
  duplicateVariantsCount: number;
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
  newVariantsCount,
  duplicateVariantsCount,
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

          {newVariantsCount > 0 && (
            <Badge
              variant="default"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg font-semibold px-3 py-1 transition-all duration-200"
            >
              <span className="mr-1">✨</span>
              {newVariantsCount} new
            </Badge>
          )}

          {duplicateVariantsCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 hover:from-amber-200 hover:to-orange-200 font-semibold px-3 py-1 shadow-sm"
            >
              <span className="mr-1">⚠️</span>
              {duplicateVariantsCount} duplicate{duplicateVariantsCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {missingRequiredCount > 0 && (
            <Badge className="bg-gradient-to-r from-destructive/10 to-destructive/20 text-destructive border-destructive/30 font-semibold px-3 py-1 shadow-sm">
              {missingRequiredCount} missing
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select attribute options below to generate variant combinations. Edit prices and stock inline, then save your changes.
          </p>

          {duplicateVariantsCount > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                <span className="mr-1">ℹ️</span>
                {duplicateVariantsCount} variant combination{duplicateVariantsCount !== 1 ? 's' : ''} already exist{duplicateVariantsCount === 1 ? 's' : ''} and will be skipped during save.
                Only new variants will be created.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={isSaving || !canSave || newVariantsCount === 0}
          size="lg"
          className={`font-semibold px-6 transition-all duration-200 ${
            canSave && newVariantsCount > 0
              ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 mr-2" />
          )}
          Save {newVariantsCount} New Variant{newVariantsCount !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
