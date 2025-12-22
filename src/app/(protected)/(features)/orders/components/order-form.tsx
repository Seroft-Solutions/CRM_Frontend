'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  OrderRecord,
  discountTypeOptions,
  getDiscountTypeCode,
  getNotificationTypeCode,
  getOrderStatusCode,
  getPaymentStatusCode,
  getShippingMethodCode,
  getUserTypeCode,
  notificationTypeOptions,
  orderStatusOptions,
  paymentStatusOptions,
  shippingMethodOptions,
  userTypeOptions,
} from '../data/order-data';
import {
  useCreateOrder,
  useUpdateOrder,
} from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import {
  useCreateOrderDetail,
  useDeleteOrderDetail,
  useUpdateOrderDetail,
} from '@/core/api/generated/spring/endpoints/order-detail-resource/order-detail-resource.gen';
import {
  useCreateOrderAddressDetail,
  useUpdateOrderAddressDetail,
} from '@/core/api/generated/spring/endpoints/order-address-detail-resource/order-address-detail-resource.gen';
import { useCreateOrderHistory } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import type { OrderDTO } from '@/core/api/generated/spring/schemas';
interface OrderFormProps {
  initialOrder?: OrderRecord;
  addressExists?: boolean;
  onSubmitSuccess?: () => void;
}

import { OrderFormAddress } from './order-form-address';
import { OrderFormFooter } from './order-form-footer';
import { OrderFormFields } from './order-form-fields';
import { OrderFormItems } from './order-form-items';
import type {
  ItemErrors,
  OrderAddressForm,
  OrderFormErrors,
  OrderFormState,
  OrderItemForm,
} from './order-form-types';

const emptyOrderItem = (): OrderItemForm => ({
  itemStatus: '',
  quantity: '',
  itemPrice: '',
  itemTaxAmount: '',
  discountType: '',
  discountCode: '',
  discountAmount: '',
  itemComment: '',
});

const parseItemStatusValue = (value?: string) => {
  if (!value) return '';
  const match = value.match(/\d+/);
  return match ? match[0] : '';
};

export function OrderForm({ initialOrder, addressExists, onSubmitSuccess }: OrderFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const isEditing = Boolean(initialOrder?.orderId);

  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: updateOrder } = useUpdateOrder();
  const { mutateAsync: createOrderDetail } = useCreateOrderDetail();
  const { mutateAsync: updateOrderDetail } = useUpdateOrderDetail();
  const { mutateAsync: deleteOrderDetail } = useDeleteOrderDetail();
  const { mutateAsync: createOrderAddressDetail } = useCreateOrderAddressDetail();
  const { mutateAsync: updateOrderAddressDetail } = useUpdateOrderAddressDetail();
  const { mutateAsync: createOrderHistory } = useCreateOrderHistory();

  const defaultState: OrderFormState = useMemo(
    () => ({
      orderStatus: initialOrder?.orderStatus || 'Pending',
      paymentStatus: initialOrder?.paymentStatus || 'Pending',
      userType: initialOrder?.userType || 'B2C',
      orderBaseAmount: initialOrder ? initialOrder.orderBaseAmount.toString() : '',
      discountAmount: initialOrder ? initialOrder.discountAmount.toString() : '',
      shippingAmount: initialOrder ? initialOrder.shippingAmount.toString() : '',
      phone: initialOrder?.phone || '',
      email: initialOrder?.email || '',
      shippingMethod: initialOrder?.shippingMethod || '',
      shippingId: initialOrder?.shippingId || '',
      discountType: initialOrder?.discountType || '',
      discountCode: initialOrder?.discountCode || '',
      notificationType: initialOrder?.notificationType || '',
      busyFlag: Boolean(initialOrder?.busyFlag),
      busyVoucherId: initialOrder?.busyVoucherId || '',
      orderComment: '',
    }),
    [initialOrder]
  );

  const [formState, setFormState] = useState<OrderFormState>(defaultState);
  const [items, setItems] = useState<OrderItemForm[]>(() => {
    if (!initialOrder?.items?.length) return [];
    return initialOrder.items.map((item) => ({
      id: item.orderDetailId || undefined,
      itemStatus: item.itemStatusCode?.toString() || parseItemStatusValue(item.itemStatus),
      quantity: item.quantity ? item.quantity.toString() : '',
      itemPrice: item.itemPrice ? item.itemPrice.toString() : '',
      itemTaxAmount: item.itemTaxAmount ? item.itemTaxAmount.toString() : '',
      discountType: item.discountType || '',
      discountCode: item.discountCode || '',
      discountAmount: item.discountAmount ? item.discountAmount.toString() : '',
      itemComment: item.itemComment || '',
    }));
  });
  const [removedItemIds, setRemovedItemIds] = useState<number[]>([]);
  const [address, setAddress] = useState<OrderAddressForm>(() => {
    const initial = initialOrder?.address;
    return {
      shipTo: {
        firstName: initial?.shipTo?.firstName || '',
        middleName: initial?.shipTo?.middleName || '',
        lastName: initial?.shipTo?.lastName || '',
        addrLine1: initial?.shipTo?.addrLine1 || '',
        addrLine2: initial?.shipTo?.addrLine2 || '',
        city: initial?.shipTo?.city || '',
        state: initial?.shipTo?.state || '',
        zipcode: initial?.shipTo?.zipcode || '',
        country: initial?.shipTo?.country || '',
        contact: initial?.shipTo?.phone || '',
      },
      billTo: {
        firstName: initial?.billTo?.firstName || '',
        middleName: initial?.billTo?.middleName || '',
        lastName: initial?.billTo?.lastName || '',
        addrLine1: initial?.billTo?.addrLine1 || '',
        addrLine2: initial?.billTo?.addrLine2 || '',
        city: initial?.billTo?.city || '',
        state: initial?.billTo?.state || '',
        zipcode: initial?.billTo?.zipcode || '',
        country: initial?.billTo?.country || '',
        contact: initial?.billTo?.phone || '',
      },
      billToSameFlag: Boolean(initial?.billToSameAsShip),
    };
  });

  const handleChange = (key: keyof OrderFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'orderBaseAmount' ||
      key === 'discountAmount' ||
      key === 'shippingAmount' ||
      key === 'phone' ||
      key === 'email' ||
      key === 'shippingId' ||
      key === 'discountCode' ||
      key === 'busyVoucherId'
    ) {
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    }
  };

  const handleItemChange = (index: number, key: keyof OrderItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
    setErrors((prev) => {
      if (!prev.items?.[index]?.[key]) {
        return prev;
      }
      const nextItems = prev.items ? [...prev.items] : [];
      const nextItem = { ...nextItems[index] };
      delete nextItem[key];
      nextItems[index] = nextItem;
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyOrderItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.id) {
        setRemovedItemIds((current) => [...current, removed.id!]);
      }
      return next;
    });
  };

  const handleAddressChange = (
    section: 'shipTo' | 'billTo',
    key: keyof AddressFieldsForm,
    value: string
  ) => {
    const nextValue = key === 'zipcode' ? value.slice(0, 10) : value;
    setAddress((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: nextValue,
      },
    }));
    if (key === 'zipcode' || key === 'contact') {
      const errorKey =
        section === 'shipTo'
          ? key === 'zipcode'
            ? 'shipToZipcode'
            : 'shipToContact'
          : key === 'zipcode'
            ? 'billToZipcode'
            : 'billToContact';
      setErrors((prev) => (prev[errorKey] ? { ...prev, [errorKey]: undefined } : prev));
    }
  };

  const toggleBillToSame = (checked: boolean) => {
    setAddress((prev) => ({
      ...prev,
      billToSameFlag: checked,
      billTo: checked ? { ...prev.shipTo } : prev.billTo,
    }));
    if (checked) {
      setErrors((prev) => ({
        ...prev,
        billToZipcode: undefined,
        billToContact: undefined,
      }));
    }
  };

  const shouldSaveAddress = (value: OrderAddressForm) => {
    const hasShipTo = Object.values(value.shipTo).some((field) => field.trim() !== '');
    const hasBillTo = Object.values(value.billTo).some((field) => field.trim() !== '');
    return hasShipTo || hasBillTo || value.billToSameFlag;
  };

  const validateForm = (): OrderFormErrors => {
    const nextErrors: OrderFormErrors = {};
    const numberPattern = /^-?\d+(\.\d+)?$/;
    const phonePattern = /^[+]?[0-9\s\-()]{10,20}$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const validateAmount = (value: string, key: 'orderBaseAmount' | 'discountAmount' | 'shippingAmount') => {
      if (!value.trim()) {
        return;
      }
      if (!numberPattern.test(value.trim())) {
        nextErrors[key] = 'Enter a valid number.';
        return;
      }
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        nextErrors[key] = 'Amount cannot be negative.';
      }
    };

    validateAmount(formState.orderBaseAmount, 'orderBaseAmount');
    validateAmount(formState.discountAmount, 'discountAmount');
    validateAmount(formState.shippingAmount, 'shippingAmount');

    if (formState.phone.trim()) {
      if (formState.phone.length > 20 || !phonePattern.test(formState.phone.trim())) {
        nextErrors.phone = 'Enter a valid phone number (10-20 digits).';
      }
    }

    if (formState.email.trim()) {
      if (formState.email.length > 50 || !emailPattern.test(formState.email.trim())) {
        nextErrors.email = 'Enter a valid email address.';
      }
    }

    if (formState.discountCode && formState.discountCode.length > 20) {
      nextErrors.discountCode = 'Max 20 characters.';
    }

    if (formState.shippingId && formState.shippingId.length > 50) {
      nextErrors.shippingId = 'Max 50 characters.';
    }

    if (formState.busyVoucherId && formState.busyVoucherId.length > 50) {
      nextErrors.busyVoucherId = 'Max 50 characters.';
    }

    if (shouldSaveAddress(address)) {
      if (address.shipTo.zipcode.trim().length > 10) {
        nextErrors.shipToZipcode = 'Max 10 characters.';
      }
      if (address.shipTo.contact.trim().length > 50) {
        nextErrors.shipToContact = 'Max 50 characters.';
      }
      if (!address.billToSameFlag) {
        if (address.billTo.zipcode.trim().length > 10) {
          nextErrors.billToZipcode = 'Max 10 characters.';
        }
        if (address.billTo.contact.trim().length > 50) {
          nextErrors.billToContact = 'Max 50 characters.';
        }
      }
    }

    const hasText = (value?: string) => Boolean(value && value.trim() !== '');
    const nextItemErrors: ItemErrors[] = items.map(() => ({}));

    items.forEach((item, index) => {
      const hasData =
        hasText(item.quantity) ||
        hasText(item.itemPrice) ||
        hasText(item.itemTaxAmount) ||
        hasText(item.discountAmount) ||
        hasText(item.discountCode) ||
        hasText(item.itemComment) ||
        hasText(item.itemStatus);

      if (!hasData) return;

      if (item.itemStatus.trim() && !/^\d+$/.test(item.itemStatus.trim())) {
        nextItemErrors[index].itemStatus = 'Use a numeric status code.';
      }

      if (item.quantity.trim() && !/^\d+$/.test(item.quantity.trim())) {
        nextItemErrors[index].quantity = 'Use a whole number.';
      }

      if (item.itemPrice.trim()) {
        const value = Number.parseFloat(item.itemPrice);
        if (!Number.isFinite(value) || value < 0) {
          nextItemErrors[index].itemPrice = 'Enter a valid amount.';
        }
      }

      if (item.itemTaxAmount.trim()) {
        const value = Number.parseFloat(item.itemTaxAmount);
        if (!Number.isFinite(value) || value < 0) {
          nextItemErrors[index].itemTaxAmount = 'Enter a valid amount.';
        }
      }

      if (item.discountAmount?.trim()) {
        const value = Number.parseFloat(item.discountAmount);
        if (!Number.isFinite(value) || value < 0) {
          nextItemErrors[index].discountAmount = 'Enter a valid amount.';
        }
      }

      if (item.discountCode && item.discountCode.length > 20) {
        nextItemErrors[index].discountCode = 'Max 20 characters.';
      }
    });

    const hasItemErrors = nextItemErrors.some((entry) => Object.keys(entry).length > 0);
    if (hasItemErrors) {
      nextErrors.items = nextItemErrors;
    }

    return nextErrors;
  };

  const orderStatusSelectOptions =
    formState.orderStatus === 'Unknown'
      ? [...orderStatusOptions, 'Unknown']
      : orderStatusOptions;
  const paymentStatusSelectOptions =
    formState.paymentStatus === 'Unknown'
      ? [...paymentStatusOptions, 'Unknown']
      : paymentStatusOptions;
  const userTypeSelectOptions =
    formState.userType === 'Unknown' ? [...userTypeOptions, 'Unknown'] : userTypeOptions;
  const shippingMethodSelectOptions =
    formState.shippingMethod === 'Unknown'
      ? [...shippingMethodOptions, 'Unknown']
      : shippingMethodOptions;
  const discountTypeSelectOptions =
    formState.discountType === 'Unknown'
      ? [...discountTypeOptions, 'Unknown']
      : discountTypeOptions;
  const notificationTypeSelectOptions =
    formState.notificationType === 'Unknown'
      ? [...notificationTypeOptions, 'Unknown']
      : notificationTypeOptions;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();
    const hasErrors = Object.values(validationErrors).some((value) => {
      if (Array.isArray(value)) {
        return value.some((entry) => Object.keys(entry).length > 0);
      }
      return Boolean(value);
    });
    if (hasErrors) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    const parseAmount = (value: string) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parseInteger = (value: string) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const buildAddressPayload = (orderId: number) => {
      const billTo = address.billToSameFlag ? address.shipTo : address.billTo;
      return {
        id: addressExists ? orderId : undefined,
        orderId,
        shipToFirstName: address.shipTo.firstName || undefined,
        shipToMiddleName: address.shipTo.middleName || undefined,
        shipToLastName: address.shipTo.lastName || undefined,
        shipToAddLine1: address.shipTo.addrLine1 || undefined,
        shipToAddLine2: address.shipTo.addrLine2 || undefined,
        shipToCity: address.shipTo.city || undefined,
        shipToState: address.shipTo.state || undefined,
        shipToZipcode: address.shipTo.zipcode || undefined,
        shipToContact: address.shipTo.contact || undefined,
        shipToCountry: address.shipTo.country || undefined,
        billToSameFlag: address.billToSameFlag || false,
        billToFirstName: billTo.firstName || undefined,
        billToMiddleName: billTo.middleName || undefined,
        billToLastName: billTo.lastName || undefined,
        billToAddLine1: billTo.addrLine1 || undefined,
        billToAddLine2: billTo.addrLine2 || undefined,
        billToCity: billTo.city || undefined,
        billToState: billTo.state || undefined,
        billToZipcode: billTo.zipcode || undefined,
        billToContact: billTo.contact || undefined,
        billToCountry: billTo.country || undefined,
      };
    };

    const baseAmount = parseAmount(formState.orderBaseAmount || '0');
    const discountAmount = parseAmount(formState.discountAmount || '0');
    const shippingAmount = parseAmount(formState.shippingAmount || '0');
    const orderTotalAmount = Math.max(baseAmount - discountAmount + shippingAmount, 0);

    const orderStatusCode =
      getOrderStatusCode(formState.orderStatus) ?? initialOrder?.orderStatusCode ?? 0;
    const paymentStatusCode =
      getPaymentStatusCode(formState.paymentStatus) ?? initialOrder?.paymentStatusCode ?? 0;
    const userTypeCode =
      getUserTypeCode(formState.userType) ?? initialOrder?.userTypeCode ?? 0;
    const discountTypeCode =
      getDiscountTypeCode(formState.discountType || undefined) ??
      initialOrder?.discountTypeCode ??
      undefined;
    const notificationTypeCode =
      getNotificationTypeCode(formState.notificationType || undefined) ??
      initialOrder?.notificationTypeCode ??
      undefined;
    const shippingMethodCode =
      getShippingMethodCode(formState.shippingMethod || undefined) ??
      initialOrder?.shippingMethodCode ??
      undefined;

    const payload: OrderDTO = {
      id: initialOrder?.orderId,
      orderStatus: orderStatusCode,
      orderTotalAmount,
      orderBaseAmount: baseAmount,
      discountAmount,
      shippingAmount,
      userType: userTypeCode,
      phone: formState.phone || undefined,
      email: formState.email || undefined,
      paymentStatus: paymentStatusCode,
      discountType: discountTypeCode,
      discountCode: formState.discountCode || undefined,
      busyFlag: formState.busyFlag ? 1 : 0,
      busyVoucherId: formState.busyVoucherId || undefined,
      notificationType: notificationTypeCode,
      shippingMethod: shippingMethodCode,
      shippingId: formState.shippingId || undefined,
    };

    try {
      const result = isEditing
        ? await updateOrder({ id: initialOrder!.orderId, data: payload })
        : await createOrder({ data: payload });

      const orderId = result?.id ?? initialOrder?.orderId;
      if (!orderId) {
        throw new Error('Order ID missing after save.');
      }

      const hasText = (value?: string) => Boolean(value && value.trim() !== '');
      const itemTasks = items
        .filter((item) => {
          const hasData =
            hasText(item.quantity) ||
            hasText(item.itemPrice) ||
            hasText(item.itemTaxAmount) ||
            hasText(item.discountAmount) ||
            hasText(item.discountCode) ||
            hasText(item.itemComment);
          return hasData;
        })
        .map((item) => {
          const quantity = parseInteger(item.quantity || '0');
          const itemPrice = parseAmount(item.itemPrice || '0');
          const itemTaxAmount = parseAmount(item.itemTaxAmount || '0');
          const discountAmountValue = parseAmount(item.discountAmount || '0');
          const itemTotalAmount = Math.max(
            quantity * itemPrice + itemTaxAmount - discountAmountValue,
            0
          );
          const itemStatus = parseInteger(item.itemStatus || '0');
          const discountType = getDiscountTypeCode(item.discountType || undefined);

          const detailPayload = {
            id: item.id,
            orderId,
            itemStatus,
            quantity,
            itemPrice,
            itemTaxAmount,
            itemTotalAmount,
            discountType,
            discountCode: item.discountCode || undefined,
            discountAmount: discountAmountValue || undefined,
            itemComment: item.itemComment || undefined,
          };

          return item.id
            ? updateOrderDetail({ id: item.id, data: detailPayload })
            : createOrderDetail({ data: detailPayload });
        });

      const deleteTasks = removedItemIds.map((id) => deleteOrderDetail({ id }));

      const addressTasks: Promise<unknown>[] = [];
      if (shouldSaveAddress(address)) {
        const addressPayload = buildAddressPayload(orderId);
        if (addressExists) {
          addressTasks.push(updateOrderAddressDetail({ id: orderId, data: addressPayload }));
        } else {
          addressTasks.push(createOrderAddressDetail({ data: addressPayload }));
        }
      }

      const statusChanged =
        initialOrder?.orderStatus && initialOrder.orderStatus !== formState.orderStatus;
      const historyStatus = isEditing
        ? statusChanged
          ? `Status changed to ${formState.orderStatus}`
          : 'Order updated'
        : `Order created (${formState.orderStatus})`;
      const historyTask = createOrderHistory({
        data: {
          orderId,
          status: historyStatus,
          notificationSent: Boolean(formState.notificationType),
        },
      });

      const results = await Promise.allSettled([
        ...itemTasks,
        ...deleteTasks,
        ...addressTasks,
        historyTask,
      ]);

      const failed = results.filter((entry) => entry.status === 'rejected');
      if (failed.length > 0) {
        toast.error('Order saved, but some related records failed.', {
          description: 'Please review items, address, or history.',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (result?.id) {
        await queryClient.invalidateQueries({ queryKey: [`/api/orders/${result.id}`] });
      }
      if (initialOrder?.orderId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/orders/${initialOrder.orderId}`] });
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-address-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-histories'] });

      toast.success(isEditing ? 'Order updated' : 'Order created', {
        description: isEditing ? 'Changes saved successfully.' : 'New order is now available.',
      });

      setRemovedItemIds([]);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else if (isEditing && initialOrder?.orderId) {
        router.push(`/orders/${initialOrder.orderId}`);
      } else if (result?.id) {
        router.push(`/orders/${result.id}`);
      } else {
        router.push('/orders');
      }
    } catch (_error) {
      toast.error('Unable to save order', {
        description: 'Please check the details and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const baseAmount = Number.parseFloat(formState.orderBaseAmount) || 0;
  const discountAmount = Number.parseFloat(formState.discountAmount) || 0;
  const shippingAmount = Number.parseFloat(formState.shippingAmount) || 0;
  const orderTotal = Math.max(baseAmount - discountAmount + shippingAmount, 0);

  const itemsTotal = items.reduce((sum, item) => {
    const qty = Number.parseInt(item.quantity, 10) || 0;
    const price = Number.parseFloat(item.itemPrice) || 0;
    const tax = Number.parseFloat(item.itemTaxAmount) || 0;
    const discount = Number.parseFloat(item.discountAmount) || 0;
    return sum + Math.max(qty * price + tax - discount, 0);
  }, 0);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border-2 border-slate-300 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Order Details</h3>
                <p className="text-sm text-muted-foreground">
                  Set status, pricing, and customer information
                </p>
              </div>
            </div>
            <OrderFormFields
              formState={formState}
              errors={errors}
              orderStatusOptions={orderStatusSelectOptions}
              paymentStatusOptions={paymentStatusSelectOptions}
              userTypeOptions={userTypeSelectOptions}
              shippingMethodOptions={shippingMethodSelectOptions}
              discountTypeOptions={discountTypeSelectOptions}
              notificationTypeOptions={notificationTypeSelectOptions}
              onChange={handleChange}
            />
          </div>

          <OrderFormItems
            items={items}
            itemErrors={errors.items}
            discountTypeOptions={discountTypeSelectOptions}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onItemChange={handleItemChange}
          />

          <OrderFormAddress
            address={address}
            errors={errors}
            onAddressChange={handleAddressChange}
            onToggleBillToSame={toggleBillToSame}
          />
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-lg border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                  <svg className="h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">Order Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                  <span className="text-sm font-medium text-slate-600">Base Amount</span>
                  <span className="font-semibold text-slate-800">
                    ${baseAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                  <span className="text-sm font-medium text-slate-600">Discount</span>
                  <span className="font-semibold text-red-600">
                    -${discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                  <span className="text-sm font-medium text-slate-600">Shipping</span>
                  <span className="font-semibold text-slate-800">
                    ${shippingAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                  <span className="text-sm font-medium text-slate-600">Items Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    ${itemsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="mt-4 flex justify-between rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 p-3">
                  <span className="font-bold text-slate-900">Order Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-md bg-white/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Quick Stats
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-semibold text-slate-800">{formState.orderStatus}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Payment</div>
                    <div className="font-semibold text-slate-800">{formState.paymentStatus}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-semibold text-slate-800">{items.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-semibold text-slate-800">{formState.userType}</div>
                  </div>
                </div>
              </div>
            </div>

            <OrderFormFooter
              formState={formState}
              submitting={submitting}
              onBusyFlagChange={(checked) => handleChange('busyFlag', checked)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
