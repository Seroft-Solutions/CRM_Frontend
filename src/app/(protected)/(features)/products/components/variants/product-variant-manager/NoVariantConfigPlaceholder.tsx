/**
 * @component NoVariantConfigPlaceholder
 * @description A placeholder component displayed when a product does not have a variant configuration assigned.
 * It guides the user to edit the product and select a configuration.
 * @returns {JSX.Element} The rendered placeholder component.
 */
export function NoVariantConfigPlaceholder() {
  return (
    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
      <div className="max-w-md mx-auto">
        <div className="mb-4 text-gray-400">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Variant Configuration</h3>
        <p className="text-gray-600 mb-4">
          Please select a variant configuration for this product before adding variants.
        </p>
        <p className="text-sm text-gray-500">
          Edit the product and choose a System Config that defines the variant attributes (e.g.,
          size, color, material).
        </p>
      </div>
    </div>
  );
}
