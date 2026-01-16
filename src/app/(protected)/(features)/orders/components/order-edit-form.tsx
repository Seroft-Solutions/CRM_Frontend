'use client';

import { useMemo } from 'react';
import { useGetOrder } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { useGetAllOrderDetails } from '@/core/api/generated/spring/endpoints/order-detail-resource/order-detail-resource.gen';
import { useGetAllOrderAddressDetails } from '@/core/api/generated/spring/endpoints/order-address-detail-resource/order-address-detail-resource.gen';
import { useGetAllOrderDiscountDetails } from '@/core/api/order-discount-detail';
import { useGetAllOrderShippingDetails } from '@/core/api/order-shipping-detail';
import {
  mapOrderAddressDetail,
  mapOrderDiscountDetail,
  mapOrderDetails,
  mapOrderDtoToRecord,
  mapOrderShippingDetail,
} from '../data/order-data';
import { OrderForm } from './order-form';

interface OrderEditFormProps {
  orderId: number;
}

export function OrderEditForm({ orderId }: OrderEditFormProps) {
  const isValidId = Number.isFinite(orderId) && orderId > 0;

  const { data, isLoading, isError } = useGetOrder(orderId, {
    query: {
      enabled: isValidId,
    },
  });

  const { data: detailsData, isLoading: isDetailsLoading } = useGetAllOrderDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const { data: addressData, isLoading: isAddressLoading } = useGetAllOrderAddressDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const { data: shippingData, isLoading: isShippingLoading } = useGetAllOrderShippingDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const { data: discountData, isLoading: isDiscountLoading } = useGetAllOrderDiscountDetails(
    isValidId ? { 'orderId.equals': orderId } : undefined,
    {
      query: {
        enabled: isValidId,
      },
    }
  );

  const order = useMemo(() => {
    if (!data) return undefined;
    const base = mapOrderDtoToRecord(data);
    return {
      ...base,
      items: mapOrderDetails(detailsData),
      address: mapOrderAddressDetail(addressData?.[0], data),
      shipping: mapOrderShippingDetail(shippingData?.[0], data),
      discount: mapOrderDiscountDetail(discountData?.[0], data),
    };
  }, [data, detailsData, addressData, shippingData, discountData]);

  if (isLoading || isDetailsLoading || isAddressLoading || isShippingLoading || isDiscountLoading) {
    return (
      <div className="rounded-md border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
        Loading order...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">
        Unable to load this order for editing.
      </div>
    );
  }

  const addressExists = Boolean(addressData?.length);
  const shippingExists = Boolean(shippingData?.length);
  const discountExists = Boolean(discountData?.length);

  return (
    <OrderForm
      initialOrder={order}
      addressExists={addressExists}
      shippingExists={shippingExists}
      discountExists={discountExists}
    />
  );
}
