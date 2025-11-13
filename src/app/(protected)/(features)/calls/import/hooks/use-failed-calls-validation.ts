'use client';

import { useCallback } from 'react';
import {
  CallStatusDTO,
  CallTypeDTO,
  CustomerDTO,
  ImportHistoryDTO,
  PriorityDTO,
  SubCallTypeDTO,
} from '@/core/api/generated/spring/schemas';
import { buildSubCallTypeKey, normalizeKey } from '../constants/failed-calls';

interface UseFailedCallsValidationProps {
  callTypeMap: Map<string, CallTypeDTO>;
  subCallTypeMap: Map<string, SubCallTypeDTO>;
  priorityMap: Map<string, PriorityDTO>;
  callStatusMap: Map<string, CallStatusDTO>;
  calltypeOptions: CallTypeDTO[];
  subcalltypeOptions: SubCallTypeDTO[];
  customerMap: Map<string, CustomerDTO>;
  validatePincodeFormat: (pincode: string) => boolean;
  canResolveReferences: boolean;
}

export function useFailedCallsValidation({
  callTypeMap,
  subCallTypeMap,
  priorityMap,
  callStatusMap,
  calltypeOptions,
  subcalltypeOptions,
  customerMap,
  validatePincodeFormat,
  canResolveReferences,
}: UseFailedCallsValidationProps) {
  const computeInvalidFields = useCallback(
    (row: ImportHistoryDTO) => {
      const invalid = new Set<keyof ImportHistoryDTO>();

      if (!row.customerBusinessName || row.customerBusinessName.trim().length === 0) {
        invalid.add('customerBusinessName');
      }

      if (!row.productName || row.productName.trim().length === 0) {
        invalid.add('productName');
      }

      const callType =
        callTypeMap.size === 0
          ? null
          : callTypeMap.get(normalizeKey(row.callType)) ||
            calltypeOptions.find((ct) => normalizeKey(ct.name) === normalizeKey(row.callType));

      if (!row.callType || (callTypeMap.size > 0 && !callType)) {
        invalid.add('callType');
      }

      if (callType?.id) {
        const availableSubCallTypes = subcalltypeOptions.filter(
          (sct) => sct.callType?.id === callType.id
        );

        if (availableSubCallTypes.length > 0) {
          if (!row.subCallType || row.subCallType.trim().length === 0) {
            invalid.add('subCallType');
          } else {
            const subKey = buildSubCallTypeKey(callType.id, row.subCallType);
            const match =
              subCallTypeMap.get(subKey) ||
              availableSubCallTypes.find(
                (sct) => normalizeKey(sct.name) === normalizeKey(row.subCallType)
              );

            if (!match) {
              invalid.add('subCallType');
            }
          }
        }
      } else if (row.subCallType) {
        const resolvedSubCallType = subcalltypeOptions.find(
          (sct) => normalizeKey(sct.name) === normalizeKey(row.subCallType)
        );

        if (!resolvedSubCallType) {
          invalid.add('subCallType');
        }
      }

      const priority = priorityMap.size === 0 ? null : priorityMap.get(normalizeKey(row.priority));

      if (!row.priority || (priorityMap.size > 0 && !priority)) {
        invalid.add('priority');
      }

      const callStatus =
        callStatusMap.size === 0 ? null : callStatusMap.get(normalizeKey(row.callStatus));

      if (!row.callStatus || (callStatusMap.size > 0 && !callStatus)) {
        invalid.add('callStatus');
      }

      const isNewCustomer = !customerMap.has(normalizeKey(row.customerBusinessName));

      if (isNewCustomer) {
        if (!row.zipCode || row.zipCode.trim().length === 0) {
          invalid.add('zipCode');
        } else if (!validatePincodeFormat(row.zipCode)) {
          invalid.add('zipCode');
        }
      }

      return invalid;
    },
    [
      callTypeMap,
      subCallTypeMap,
      priorityMap,
      callStatusMap,
      calltypeOptions,
      subcalltypeOptions,
      validatePincodeFormat,
      customerMap,
    ]
  );

  const getComputedIssues = useCallback(
    (row: ImportHistoryDTO, invalid: Set<keyof ImportHistoryDTO>) => {
      const issues: string[] = [];

      if (!canResolveReferences) {
        issues.push('Master data is still loading. Please wait before validating this row.');
      }
      invalid.forEach((field) => {
        switch (field) {
          case 'customerBusinessName':
            issues.push('Customer name is required.');
            break;
          case 'productName':
            issues.push('Product name is required.');
            break;
          case 'callType':
            issues.push('Call Type mismatch. Please select a valid Call Type.');
            break;
          case 'subCallType':
            if (!row.subCallType || row.subCallType.trim().length === 0) {
              issues.push('Sub Call Type is required for the selected Call Type.');
            } else {
              issues.push('Sub Call Type must belong to the selected Call Type.');
            }
            break;
          case 'priority':
            issues.push('Priority is required and must match master data.');
            break;
          case 'callStatus':
            issues.push('Call Status is required and must match master data.');
            break;
          case 'zipCode':
            if (!row.zipCode || row.zipCode.trim().length === 0) {
              issues.push('Zip Code is required for new customers.');
            } else if (!validatePincodeFormat(row.zipCode)) {
              issues.push('Zip Code must be exactly 6 digits.');
            }
            break;
          default:
            break;
        }
      });

      return issues;
    },
    [canResolveReferences, validatePincodeFormat]
  );

  return {
    computeInvalidFields,
    getComputedIssues,
  };
}
