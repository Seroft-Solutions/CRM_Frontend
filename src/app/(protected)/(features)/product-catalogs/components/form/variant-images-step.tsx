'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useWatch } from 'react-hook-form';
import { useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEntityForm } from './product-catalog-form-provider';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { getGetAllProductVariantImagesByVariantQueryOptions } from '@/core/api/generated/spring/endpoints/product-variant-images/product-variant-images.gen';
import { normalizeCatalogImageValue, resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';

type VariantImageOption = {
  key: string;
  value: string;
  previewUrl: string;
  variantLabel: string;
  rawUrls: string[];
};

export function VariantImagesStep() {
  const { form } = useEntityForm();
  const selectedVariantIds = useWatch({ control: form.control, name: 'variants' });
  const selectedImage = useWatch({ control: form.control, name: 'image' });

  const variantIds = useMemo(
    () =>
      Array.isArray(selectedVariantIds)
        ? Array.from(
            new Set(
              selectedVariantIds.filter((id): id is number => typeof id === 'number')
            )
          )
        : [],
    [selectedVariantIds]
  );

  const { data: variantsData = [], isLoading: isLoadingVariants } = useGetAllProductVariants(
    variantIds.length
      ? {
          'id.in': variantIds,
          size: 200,
          sort: ['sku,asc'],
        }
      : undefined,
    {
      query: { enabled: variantIds.length > 0 },
    }
  );

  const variantLabelById = useMemo(() => {
    const map = new Map<number, string>();
    variantsData.forEach((variant) => {
      if (typeof variant.id === 'number') {
        map.set(variant.id, variant.sku || `Variant ${variant.id}`);
      }
    });
    return map;
  }, [variantsData]);

  const imageQueries = useQueries({
    queries: variantIds.map((variantId) =>
      getGetAllProductVariantImagesByVariantQueryOptions(variantId, {
        query: { enabled: !!variantId },
      })
    ),
  });

  const isLoadingImages = imageQueries.some((query) => query.isLoading);

  const imageOptions: VariantImageOption[] = variantIds.flatMap((variantId, index) => {
    const images = imageQueries[index]?.data ?? [];
    const variantLabel = variantLabelById.get(variantId) || `Variant ${variantId}`;

    return images
      .slice()
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((image, imageIndex) => {
        const rawUrls = [image.cdnUrl, image.thumbnailUrl].filter(
          (url): url is string => Boolean(url)
        );
        const normalizedRawUrl = rawUrls[0] ? normalizeCatalogImageValue(rawUrls[0]) : '';
        const gumletUrl = image.gumletPath ? resolveCatalogImageUrl(image.gumletPath) : '';
        const rawUrlsForMatch = Array.from(
          new Set([gumletUrl, image.gumletPath, ...rawUrls, normalizedRawUrl].filter(Boolean))
        );
        const value = rawUrls[0] || gumletUrl || image.gumletPath || normalizedRawUrl;
        const previewUrl =
          image.thumbnailUrl || image.cdnUrl || (image.gumletPath ? gumletUrl : '');

        if (!value || !previewUrl) return null;

        return {
          key: image.id
            ? `variant-${variantId}-image-${image.id}`
            : `variant-${variantId}-image-${image.gumletAssetId || imageIndex}`,
          value,
          previewUrl,
          variantLabel,
          rawUrls: rawUrlsForMatch,
        };
      })
      .filter((option): option is VariantImageOption => Boolean(option));
  });

  const matchImageOption = (value?: string) => {
    if (!value) return undefined;
    return imageOptions.find(
      (option) => option.value === value || option.rawUrls.includes(value)
    );
  };

  useEffect(() => {
    if (!selectedImage) return;

    if (variantIds.length === 0) {
      form.setValue('image', '');
      form.trigger('image');
      return;
    }

    if (isLoadingVariants || isLoadingImages) {
      return;
    }

    const matchedOption = matchImageOption(selectedImage);

    if (matchedOption && matchedOption.value !== selectedImage) {
      form.setValue('image', matchedOption.value);
      form.trigger('image');
      return;
    }

    const isStillValid = Boolean(matchedOption);

    if (!isStillValid) {
      form.setValue('image', '');
      form.trigger('image');
    }
  }, [
    selectedImage,
    variantIds.length,
    imageOptions,
    isLoadingVariants,
    isLoadingImages,
    form,
  ]);

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field }) => {
        const selectedValue = field.value ? String(field.value) : '';
        const selectedOption = matchImageOption(selectedValue);
        const previewUrl =
          selectedOption?.previewUrl ||
          (selectedValue ? resolveCatalogImageUrl(selectedValue) : '');

        return (
          <FormItem className="space-y-4">
            <FormLabel className="text-sm font-medium">Catalog Image</FormLabel>
            <FormControl>
              <div className="space-y-6">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Selected image</div>
                      <div className="text-xs text-muted-foreground">
                        This image will be saved with the catalog.
                      </div>
                    </div>
                    {selectedValue ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange('')}
                      >
                        Clear selection
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    {selectedValue ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-white">
                          <Image
                            src={previewUrl}
                            alt="Selected catalog image"
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {selectedOption?.variantLabel || 'Image selected'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No image selected.</div>
                    )}
                  </div>
                </div>

                {variantIds.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                    Select variants in the previous step to load images.
                  </div>
                ) : isLoadingVariants || isLoadingImages ? (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                    Loading variant images...
                  </div>
                ) : imageOptions.length === 0 ? (
                  <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                    No images found for the selected variants.
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedValue}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.trigger('image');
                    }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {imageOptions.map((option) => {
                      const isSelected = option.value === selectedValue;

                      return (
                        <div
                          key={option.key}
                          className={`relative rounded-lg border p-2 transition ${
                            isSelected
                              ? 'border-primary ring-1 ring-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={option.key} className="absolute right-2 top-2" />
                          <label htmlFor={option.key} className="flex flex-col gap-2 cursor-pointer">
                            <div className="relative h-24 w-24 mx-auto overflow-hidden rounded-md bg-muted">
                              <Image
                                src={option.previewUrl}
                                alt={`${option.variantLabel} image`}
                                fill
                                className="object-cover"
                                sizes="96px"
                                unoptimized
                              />
                            </div>
                            <Badge variant="secondary" className="w-fit text-[10px]">
                              {option.variantLabel}
                            </Badge>
                          </label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}

                {selectedValue && !selectedOption && imageOptions.length > 0 ? (
                  <div className="text-xs text-amber-600">
                    The selected image is not part of the current variant selection.
                  </div>
                ) : null}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
