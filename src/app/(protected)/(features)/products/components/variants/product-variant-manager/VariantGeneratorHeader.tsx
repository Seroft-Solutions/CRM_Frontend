import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

/**
 * @interface VariantGeneratorHeaderProps
 * @description Props for the VariantGeneratorHeader component.
 * @property {number} newVariantsCount - The number of new variants that will be created.
 * @property {number} duplicateVariantsCount - The number of duplicate variants that already exist.
 * @property {number} missingRequiredCount - The number of required attributes that are missing a selection.
 * @property {boolean} isCreateMode - Flag indicating if in create mode (no productId).
 */
interface VariantGeneratorHeaderProps {
  newVariantsCount: number;
  duplicateVariantsCount: number;
  missingRequiredCount: number;
  isCreateMode?: boolean;
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
  isCreateMode = false,
}: VariantGeneratorHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Create Variants</h3>
          </div>

          {newVariantsCount > 0 && (
            <Badge variant="default" className="bg-green-500 text-white text-xs">
              {newVariantsCount} new
            </Badge>
          )}

          {duplicateVariantsCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 border-amber-300 text-xs"
            >
              {duplicateVariantsCount} duplicate{duplicateVariantsCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {missingRequiredCount > 0 && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
              {missingRequiredCount} missing
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {isCreateMode
            ? 'Select attribute options to generate variants. They will be saved when you save the product.'
            : 'Select attribute options below to generate variant combinations. They will be saved when you save the product.'}
        </p>

        {duplicateVariantsCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <p className="text-xs text-amber-800">
              {duplicateVariantsCount} variant combination{duplicateVariantsCount !== 1 ? 's' : ''}{' '}
              already exist{duplicateVariantsCount === 1 ? 's' : ''} and will be skipped.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
