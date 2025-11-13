'use client';

import { useCallback, useMemo } from 'react';
import {
  useGetAllCallStatuses,
  useGetAllCallTypes,
  useGetAllCustomers,
  useGetAllPriorities,
  useGetAllProducts,
  useGetAllSubCallTypes,
} from '@/core/api/generated/spring';
import {
  CallStatusDTO,
  CallTypeDTO,
  CustomerDTO,
  ImportHistoryDTO,
  PriorityDTO,
  ProductDTO,
  SubCallTypeDTO,
} from '@/core/api/generated/spring/schemas';
import { normalizeKey, buildSubCallTypeKey } from '../constants/failed-calls';
import { SearchableOption } from '../types';

export function useFailedCallsMasterData() {
  const { data: priorityOptions = [] } = useGetAllPriorities({ page: 0, size: 1000 });
  const { data: calltypeOptions = [] } = useGetAllCallTypes({ page: 0, size: 1000 });
  const { data: subcalltypeOptions = [] } = useGetAllSubCallTypes({ page: 0, size: 1000 });
  const { data: customerOptions = [] } = useGetAllCustomers({ page: 0, size: 1000 });
  const { data: productOptions = [] } = useGetAllProducts({ page: 0, size: 1000 });
  const { data: callstatusOptions = [] } = useGetAllCallStatuses({ page: 0, size: 1000 });

  const customerMap = useMemo(() => {
    const map = new Map<string, CustomerDTO>();

    customerOptions.forEach((customer) => {
      const key = normalizeKey(customer.customerBusinessName);

      if (key) {
        map.set(key, customer);
      }
    });

    return map;
  }, [customerOptions]);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductDTO>();

    productOptions.forEach((product) => {
      const key = normalizeKey(product.name);

      if (key) {
        map.set(key, product);
      }
    });

    return map;
  }, [productOptions]);

  const callTypeMap = useMemo(() => {
    const map = new Map<string, CallTypeDTO>();

    calltypeOptions.forEach((callType) => {
      const key = normalizeKey(callType.name);

      if (key) {
        map.set(key, callType);
      }
    });

    return map;
  }, [calltypeOptions]);

  const subCallTypeMap = useMemo(() => {
    const map = new Map<string, SubCallTypeDTO>();

    subcalltypeOptions.forEach((subCallType) => {
      const parentId = subCallType.callType?.id;

      if (parentId && subCallType.name) {
        map.set(buildSubCallTypeKey(parentId, subCallType.name), subCallType);
      }
    });

    return map;
  }, [subcalltypeOptions]);

  const priorityMap = useMemo(() => {
    const map = new Map<string, PriorityDTO>();

    priorityOptions.forEach((priority) => {
      const key = normalizeKey(priority.name);

      if (key) {
        map.set(key, priority);
      }
    });

    return map;
  }, [priorityOptions]);

  const callStatusMap = useMemo(() => {
    const map = new Map<string, CallStatusDTO>();

    callstatusOptions.forEach((status) => {
      const key = normalizeKey(status.name);

      if (key) {
        map.set(key, status);
      }
    });

    return map;
  }, [callstatusOptions]);

  const canResolveReferences = Boolean(
    customerOptions.length &&
      productOptions.length &&
      calltypeOptions.length &&
      priorityOptions.length &&
      callstatusOptions.length
  );

  const getColumnOptions = useCallback(
    (columnName: string, rowData: ImportHistoryDTO): SearchableOption[] | null => {
      switch (columnName) {
        case 'Customer name':
          return customerOptions.map((c) => ({
            value: c.customerBusinessName,
            label: c.customerBusinessName,
          }));
        case 'Product Name':
          return productOptions.map((p) => ({ value: p.name, label: p.name }));
        case 'Call Type':
          return calltypeOptions.map((ct) => ({ value: ct.name, label: ct.name }));
        case 'Sub Call Type': {
          const selectedCallType = calltypeOptions.find((ct) => ct.name === rowData['callType']);

          if (!selectedCallType) return [];
          const subOptions = subcalltypeOptions
            .filter((sct) => sct.callType?.id === selectedCallType.id)
            .map((sct) => ({ value: sct.name, label: sct.name }));

          if (subOptions.length === 0) {
            return [{ value: '', label: 'N/A' }];
          }

          return subOptions;
        }
        case 'Priority':
          return priorityOptions.map((p) => ({ value: p.name, label: p.name }));
        case 'Call Status':
          return callstatusOptions.map((cs) => ({ value: cs.name, label: cs.name }));
        default:
          return null;
      }
    },
    [
      customerOptions,
      productOptions,
      calltypeOptions,
      subcalltypeOptions,
      priorityOptions,
      callstatusOptions,
    ]
  );

  return {
    customerOptions,
    productOptions,
    calltypeOptions,
    subcalltypeOptions,
    priorityOptions,
    callstatusOptions,
    customerMap,
    productMap,
    callTypeMap,
    subCallTypeMap,
    priorityMap,
    callStatusMap,
    canResolveReferences,
    getColumnOptions,
  };
}
