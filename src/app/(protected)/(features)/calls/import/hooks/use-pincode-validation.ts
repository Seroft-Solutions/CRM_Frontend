'use client';

import { useCallback, useState } from 'react';
import { failedCallsDebugLog } from '../utils/failed-calls-logger';

const PINCODE_REGEX = /^[0-9]{6}$/;

export function usePincodeValidation() {
  const [pincodeValidationCache, setPincodeValidationCache] = useState<Record<string, boolean>>({});

  const validatePincodeFormat = useCallback((pincode: string): boolean => {
    return PINCODE_REGEX.test(pincode?.trim() || '');
  }, []);

  const validatePincodeExists = useCallback(
    async (pincode: string): Promise<boolean> => {
      if (pincodeValidationCache[pincode] !== undefined) {
        return pincodeValidationCache[pincode];
      }

      try {
        const { searchGeography } = await import(
          '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen'
        );
        const areas = await searchGeography({ term: pincode, size: 1 });
        const isValid = Boolean(
          areas && areas.length > 0 && areas[0].pincode === pincode && areas[0].status === 'ACTIVE'
        );

        setPincodeValidationCache((prev) => ({ ...prev, [pincode]: isValid }));

        return isValid;
      } catch (error) {
        failedCallsDebugLog('Pincode validation error', { pincode, error });

        return false;
      }
    },
    [pincodeValidationCache]
  );

  return {
    validatePincodeFormat,
    validatePincodeExists,
  };
}
