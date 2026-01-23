'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  OrderStatus,
  PaymentStatus,
  OrderRecord,
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
} from '../data/purchase-order-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCreatePurchaseOrder as useCreateOrder,
  useUpdatePurchaseOrder as useUpdateOrder,
} from '@/core/api/purchase-order';
import { useGetSundryCreditor as useGetCustomer } from '@/core/api/generated/spring/endpoints/sundry-creditor-resource/sundry-creditor-resource.gen';
import type { SundryCreditorDTO as CustomerDTO } from '@/core/api/generated/spring/schemas/SundryCreditorDTO';
import type { PurchaseOrderDTO as OrderDTO } from '@/core/api/purchase-order';
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
import {
  useCreateOrderShippingDetail,
  useUpdateOrderShippingDetail,
} from '@/core/api/order-shipping-detail';
import { getDiscountByCode } from '../../discounts/actions/discount-api';
import type { IDiscount } from '../../discounts/types/discount';
import type {
  AddressFieldsForm,
  ItemErrors,
  OrderAddressForm,
  OrderFormErrors,
  OrderFormState,
  OrderItemForm,
} from './order-form-types';
import { OrderFormAddress } from './order-form-address';
import { OrderFormFooter } from './order-form-footer';
import { OrderFormFields } from './order-form-fields';
import { OrderFormItems } from './order-form-items';
import { FieldError } from './order-form-field-error';

interface OrderFormProps {
  initialOrder?: OrderRecord;
  addressExists?: boolean;
  shippingExists?: boolean;
  onSubmitSuccess?: () => void;
}

const taxRateOptions = ['6', '12', '18'] as const;

const emptyOrderItem = (itemType: OrderItemForm['itemType'] = 'product'): OrderItemForm => ({
  itemType,
  itemStatus: '',
  quantity: '',
  itemPrice: '',
  itemTaxAmount: '',
  itemComment: '',
});

const calculateItemsTotal = (items: OrderItemForm[]) =>
  items.reduce((sum, item) => {
    const qty = Number.parseInt(item.quantity, 10) || 0;
    const price = Number.parseFloat(item.itemPrice) || 0;
    const tax = Number.parseFloat(item.itemTaxAmount) || 0;
    return sum + Math.max(qty * price + tax, 0);
  }, 0);

const calculateItemTotal = (item: OrderItemForm) => {
  const qty = Number.parseInt(item.quantity, 10) || 0;
  const price = Number.parseFloat(item.itemPrice) || 0;
  const tax = Number.parseFloat(item.itemTaxAmount) || 0;
  return Math.max(qty * price + tax, 0);
};

const hasItemData = (item: OrderItemForm) => {
  const hasText = (value?: string) => Boolean(value && value.trim() !== '');
  return Boolean(
    item.productId ||
    item.variantId ||
    item.productCatalogId ||
    hasText(item.quantity) ||
    hasText(item.itemPrice) ||
    hasText(item.itemTaxAmount) ||
    hasText(item.itemComment)
  );
};

const parseItemStatusValue = (value?: string) => {
  if (!value) return '';
  const match = value.match(/\d+/);
  return match ? match[0] : '';
};

export function OrderForm({
  initialOrder,
  addressExists,
  shippingExists,
  onSubmitSuccess,
}: OrderFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [showEmptyCartDialog, setShowEmptyCartDialog] = useState(false);
  const [showItemsBreakdown, setShowItemsBreakdown] = useState(false);
  const isEditing = Boolean(initialOrder?.orderId);

  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: updateOrder } = useUpdateOrder();
  const { mutateAsync: createOrderDetail } = useCreateOrderDetail();
  const { mutateAsync: updateOrderDetail } = useUpdateOrderDetail();
  const { mutateAsync: deleteOrderDetail } = useDeleteOrderDetail();
  const { mutateAsync: createOrderAddressDetail } = useCreateOrderAddressDetail();
  const { mutateAsync: updateOrderAddressDetail } = useUpdateOrderAddressDetail();
  const { mutateAsync: createOrderShippingDetail } = useCreateOrderShippingDetail();
  const { mutateAsync: updateOrderShippingDetail } = useUpdateOrderShippingDetail();
  const { mutateAsync: createOrderHistory } = useCreateOrderHistory();

  const defaultState: OrderFormState = useMemo(() => {
    return {
      orderStatus: initialOrder?.orderStatus || 'Pending',
      paymentStatus: initialOrder?.paymentStatus || 'Pending',
      userType: initialOrder?.userType || 'B2C',
      orderBaseAmount: initialOrder ? initialOrder.orderBaseAmount.toString() : '',
      shippingAmount: initialOrder ? initialOrder.shipping.shippingAmount.toString() : '',
      orderTaxRate:
        typeof initialOrder?.orderTaxRate === 'number' ? initialOrder.orderTaxRate.toString() : '',
      customerId: initialOrder?.sundryCreditor?.id ? String(initialOrder.sundryCreditor.id) : '',
      shippingMethod: initialOrder?.shipping.shippingMethod || '',
      shippingId: initialOrder?.shipping.shippingId || '',
      discountCode: initialOrder?.discountCode || '',
      notificationType: initialOrder?.notificationType || '',
      busyFlag: Boolean(initialOrder?.busyFlag),
      busyVoucherId: initialOrder?.busyVoucherId || '',
      orderComment: '',
    };
  }, [initialOrder]);

  const [formState, setFormState] = useState<OrderFormState>(defaultState);
  const [discountData, setDiscountData] = useState<IDiscount | null>(null);
  const [useCustomTaxRate, setUseCustomTaxRate] = useState(() => {
    const rate = defaultState.orderTaxRate.trim();
    return rate !== '' && !taxRateOptions.includes(rate as (typeof taxRateOptions)[number]);
  });
  const [shippingEditable, setShippingEditable] = useState(false);
  const [items, setItems] = useState<OrderItemForm[]>(() => {
    if (!initialOrder?.items?.length) return [];
    return initialOrder.items.map((item) => ({
      id: item.orderDetailId || undefined,
      itemType: item.productCatalogId ? 'catalog' : 'product',
      productId: item.productId || undefined,
      variantId: item.variantId || undefined,
      productCatalogId: item.productCatalogId || undefined,
      productName: item.productName || undefined,
      sku: item.sku || undefined,
      variantAttributes: item.variantAttributes || undefined,
      itemStatus: item.itemStatusCode?.toString() || parseItemStatusValue(item.itemStatus),
      quantity: item.quantity ? item.quantity.toString() : '',
      itemPrice: item.itemPrice ? item.itemPrice.toString() : '',
      itemTaxAmount: item.itemTaxAmount ? item.itemTaxAmount.toString() : '',
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
  const hasAddressValues = (fields: AddressFieldsForm) =>
    Object.values(fields).some((value) => value.trim() !== '');
  const hasInitialBillToRef = useRef(
    hasAddressValues(address.billTo) ||
    (address.billToSameFlag && hasAddressValues(address.shipTo))
  );
  const hasInitialShipToRef = useRef(hasAddressValues(address.shipTo));
  const lastCustomerIdRef = useRef<number | null>(null);
  const discountCodeRef = useRef<string>('');

  const selectedCustomerId = formState.customerId.trim()
    ? Number.parseInt(formState.customerId, 10)
    : undefined;
  const { data: sundryCreditorData } = useGetCustomer(selectedCustomerId || 0, {
    query: { enabled: Boolean(selectedCustomerId) },
  });
  const initialCustomer = initialOrder?.sundryCreditor;
  const selectedCustomerEmail =
    sundryCreditorData?.email ??
    (initialCustomer?.id === selectedCustomerId ? initialOrder?.email : undefined);
  const selectedCustomerPhone =
    sundryCreditorData?.mobile ??
    (initialCustomer?.id === selectedCustomerId ? initialOrder?.phone : undefined);

  const splitContactPerson = (contactPerson?: string) => {
    if (!contactPerson?.trim()) {
      return { firstName: '', middleName: '', lastName: '' };
    }
    const parts = contactPerson.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: '', lastName: '' };
    }
    if (parts.length === 2) {
      return { firstName: parts[0], middleName: '', lastName: parts[1] };
    }
    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  };

  const buildAddressFromCustomer = (customer: CustomerDTO): AddressFieldsForm => {
    const { firstName, middleName, lastName } = splitContactPerson(customer.contactPerson);
    return {
      firstName,
      middleName,
      lastName,
      addrLine1: customer.area?.name ?? '',
      addrLine2: '',
      city: customer.area?.city?.name ?? '',
      state: customer.area?.city?.district?.state?.name ?? '',
      zipcode: customer.area?.pincode ?? '',
      country: customer.area?.city?.district?.state?.country ?? '',
      contact: customer.mobile ?? '',
    };
  };

  useEffect(() => {
    if (!sundryCreditorData) return;
    const currentId = sundryCreditorData.id ?? null;
    const previousId = lastCustomerIdRef.current;
    const shouldAutoFill =
      previousId === null
        ? !addressExists || !hasInitialShipToRef.current
        : previousId !== currentId;

    if (!shouldAutoFill) {
      lastCustomerIdRef.current = currentId;
      return;
    }

    setAddress((prev) => ({
      ...prev,
      shipTo: buildAddressFromCustomer(sundryCreditorData),
    }));
    setShippingEditable(false);
    lastCustomerIdRef.current = currentId;
  }, [addressExists, sundryCreditorData?.id]);

  useEffect(() => {
    const code = formState.discountCode?.trim() || '';
    if (!code) {
      setDiscountData(null);
      discountCodeRef.current = '';
      return;
    }
    if (discountCodeRef.current && discountCodeRef.current !== code) {
      setDiscountData(null);
    }
    discountCodeRef.current = code;
  }, [formState.discountCode]);

  const handleChange = (key: keyof OrderFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'orderBaseAmount' ||
      key === 'shippingAmount' ||
      key === 'orderTaxRate' ||
      key === 'shippingId' ||
      key === 'discountCode' ||
      key === 'busyVoucherId' ||
      key === 'customerId'
    ) {
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    }
  };

  const handleTaxRateSelect = (value: string) => {
    if (value === 'custom') {
      setUseCustomTaxRate(true);
      if (taxRateOptions.includes(formState.orderTaxRate as (typeof taxRateOptions)[number])) {
        handleChange('orderTaxRate', '');
      }
      return;
    }
    setUseCustomTaxRate(false);
    handleChange('orderTaxRate', value);
  };

  const handleItemChange = (index: number, key: keyof OrderItemForm, value: string | number | undefined) => {
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

  const addCatalogItem = () => {
    setItems((prev) => [...prev, emptyOrderItem('catalog')]);
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

  const isDiscountActive = (discount?: IDiscount | null) =>
    (discount?.status || '').toUpperCase() === 'ACTIVE';

  const isDiscountInDateRange = (discount?: IDiscount | null) => {
    if (!discount) return false;
    const today = new Date();
    const start = discount.startDate ? new Date(discount.startDate) : null;
    const end = discount.endDate ? new Date(discount.endDate) : null;
    if (start && Number.isNaN(start.getTime())) {
      return false;
    }
    if (end && Number.isNaN(end.getTime())) {
      return false;
    }
    if (start && today < start) {
      return false;
    }
    if (end && today > end) {
      return false;
    }
    return true;
  };

  const resolveDiscountAmount = (baseAmount: number, discount?: IDiscount | null) => {
    if (!discount || !isDiscountActive(discount) || !isDiscountInDateRange(discount)) {
      return 0;
    }
    const discountType = (discount.discountType || '').toUpperCase();
    const rawValue = Number(discount.discountValue ?? discount.discountAmount ?? 0);
    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      return 0;
    }
    let amount = 0;
    if (discountType === 'PERCENTAGE') {
      const safePercent = Math.min(Math.max(rawValue, 0), 100);
      amount = (safePercent / 100) * baseAmount;
    } else {
      amount = Math.max(rawValue, 0);
    }
    const maxDiscountValue = Number(discount.maxDiscountValue);
    if (Number.isFinite(maxDiscountValue) && maxDiscountValue > 0) {
      amount = Math.min(amount, maxDiscountValue);
    }
    return Math.max(amount, 0);
  };

  const fetchDiscountByCode = async (code: string) => {
    try {
      const discount = await getDiscountByCode(code);
      setDiscountData(discount);
      const isValid = isDiscountActive(discount) && isDiscountInDateRange(discount);
      if (isValid) {
        toast.success(`Discount code "${discount.discountCode}" applied!`);
      } else {
        toast.error('This discount code is inactive or expired.');
      }
      return discount;
    } catch (error) {
      console.error('Failed to verify discount code:', error);
      setDiscountData(null);
      toast.error('Invalid discount code.');
      return null;
    }
  };

  const handleVerifyDiscount = async () => {
    const code = formState.discountCode?.trim();
    if (!code) {
      toast.error('Please enter a discount code.');
      return;
    }

    await fetchDiscountByCode(code);
  };

  const shouldSaveAddress = (value: OrderAddressForm) => {
    const hasShipTo = Object.values(value.shipTo).some((field) => field.trim() !== '');
    const hasBillTo = Object.values(value.billTo).some((field) => field.trim() !== '');
    return hasShipTo || hasBillTo || value.billToSameFlag;
  };

  const validateForm = (): OrderFormErrors => {
    const nextErrors: OrderFormErrors = {};
    const numberPattern = /^-?\d+(\.\d+)?$/;

    const validateAmount = (
      value: string,
      key: 'orderBaseAmount' | 'shippingAmount'
    ) => {
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

    const validatePercentage = (value: string, key: 'orderTaxRate') => {
      if (!value.trim()) {
        return;
      }
      if (!numberPattern.test(value.trim())) {
        nextErrors[key] = 'Enter a valid percentage.';
        return;
      }
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        nextErrors[key] = 'Percentage must be between 0 and 100.';
      }
    };

    validateAmount(formState.orderBaseAmount, 'orderBaseAmount');
    validateAmount(formState.shippingAmount, 'shippingAmount');
    validatePercentage(formState.orderTaxRate, 'orderTaxRate');

    if (formState.notificationType === 'Email') {
      const customerEmail = selectedCustomerEmail?.trim() || '';
      if (!customerEmail) {
        nextErrors.customerId = 'Select a customer with an email address.';
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
  const notificationTypeSelectOptions =
    formState.notificationType === 'Unknown'
      ? [...notificationTypeOptions, 'Unknown']
      : notificationTypeOptions;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.some(hasItemData)) {
      setShowEmptyCartDialog(true);
      return;
    }
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

    const itemsTotal = calculateItemsTotal(items);
    const baseAmount = formState.orderBaseAmount.trim()
      ? parseAmount(formState.orderBaseAmount)
      : itemsTotal;
    const discountCode = formState.discountCode?.trim() || '';
    let resolvedDiscount = discountData;
    if (discountCode && discountData?.discountCode?.toUpperCase() !== discountCode.toUpperCase()) {
      resolvedDiscount = await fetchDiscountByCode(discountCode);
    }
    const discountAmount = resolveDiscountAmount(baseAmount, resolvedDiscount);
    const shippingAmount = parseAmount(formState.shippingAmount || '0');
    const taxRate = Math.min(Math.max(parseAmount(formState.orderTaxRate || '0'), 0), 100);
    const taxableAmount = Math.max(baseAmount - discountAmount, 0);
    const taxAmount = (taxRate / 100) * taxableAmount;
    const orderTotalAmount = Math.max(taxableAmount + shippingAmount + taxAmount, 0);

    const orderStatusCode =
      getOrderStatusCode(formState.orderStatus) ?? initialOrder?.orderStatusCode ?? 0;
    const paymentStatusCode =
      getPaymentStatusCode(formState.paymentStatus) ?? initialOrder?.paymentStatusCode ?? 0;
    const userTypeCode =
      getUserTypeCode(formState.userType) ?? initialOrder?.userTypeCode ?? 0;
    const notificationTypeCode =
      getNotificationTypeCode(formState.notificationType || undefined) ??
      initialOrder?.notificationTypeCode ??
      undefined;
    const shippingMethodCode =
      getShippingMethodCode(formState.shippingMethod || undefined) ??
      initialOrder?.shipping.shippingMethodCode ??
      undefined;

    const sundryCreditorPayload = selectedCustomerId
      ? ({ id: selectedCustomerId } as CustomerDTO)
      : undefined;

    const payload: OrderDTO = {
      id: initialOrder?.orderId,
      orderStatus: orderStatusCode,
      orderTotalAmount,
      orderTaxRate: taxRate,
      sundryCreditor: sundryCreditorPayload,
      orderBaseAmount: baseAmount,
      userType: userTypeCode,
      phone: selectedCustomerPhone || undefined,
      email: selectedCustomerEmail || undefined,
      paymentStatus: paymentStatusCode,
      busyFlag: formState.busyFlag ? 1 : 0,
      busyVoucherId: formState.busyVoucherId || undefined,
      notificationType: notificationTypeCode,
      discountCode: discountCode || undefined,
    };

    try {
      const result = isEditing
        ? await updateOrder({ id: initialOrder!.orderId, data: payload })
        : await createOrder({ data: payload });

      const orderId = result?.id ?? initialOrder?.orderId;
      if (!orderId) {
        throw new Error('Order ID missing after save.');
      }

      const itemTasks = items
        .filter((item) => {
          const hasData =
            item.productId ||
            item.variantId ||
            item.productCatalogId ||
            item.quantity?.trim() ||
            item.itemPrice?.trim() ||
            item.itemTaxAmount?.trim() ||
            item.itemComment?.trim();
          return hasData;
        })
        .map((item) => {
          const isCatalog = item.itemType === 'catalog' || Boolean(item.productCatalogId);
          const quantity = parseInteger(item.quantity || '0');
          const itemPrice = parseAmount(item.itemPrice || '0');
          const itemTaxAmount = parseAmount(item.itemTaxAmount || '0');
          const itemTotalAmount = Math.max(quantity * itemPrice + itemTaxAmount, 0);
          const itemStatus = parseInteger(item.itemStatus || '0');

          const detailPayload = {
            id: item.id,
            orderId,
            productId: isCatalog ? undefined : item.productId || undefined,
            variantId: isCatalog ? undefined : item.variantId || undefined,
            productCatalogId: isCatalog ? item.productCatalogId || undefined : undefined,
            productName: item.productName || undefined,
            sku: item.sku || undefined,
            variantAttributes: item.variantAttributes || undefined,
            itemStatus,
            quantity,
            itemPrice,
            itemTaxAmount,
            itemTotalAmount,
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

      const shippingTasks: Promise<unknown>[] = [];
      const shouldSaveShipping =
        Boolean(shippingExists) ||
        Boolean(formState.shippingId?.trim()) ||
        typeof shippingMethodCode === 'number' ||
        shippingAmount > 0;

      if (shouldSaveShipping) {
        const shippingPayload = {
          id: shippingExists ? orderId : undefined,
          orderId,
          shippingAmount,
          shippingMethod: shippingMethodCode,
          shippingId: formState.shippingId || undefined,
        };

        if (shippingExists) {
          shippingTasks.push(updateOrderShippingDetail({ id: orderId, data: shippingPayload }));
        } else {
          shippingTasks.push(createOrderShippingDetail({ data: shippingPayload }));
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
        ...shippingTasks,
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
      await queryClient.invalidateQueries({ queryKey: ['/api/order-shipping-details'] });
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

  const itemsTotal = calculateItemsTotal(items);
  const baseAmount = formState.orderBaseAmount.trim()
    ? Number.parseFloat(formState.orderBaseAmount) || 0
    : itemsTotal;
  const discountCodeValue = formState.discountCode?.trim() || '';
  const activeDiscount =
    discountCodeValue &&
      discountData?.discountCode?.toUpperCase() === discountCodeValue.toUpperCase()
      ? discountData
      : null;
  const discountAmount = resolveDiscountAmount(baseAmount, activeDiscount);
  const discountLabel = discountCodeValue ? `Discount (${discountCodeValue})` : 'Discount';
  const shippingAmount = Number.parseFloat(formState.shippingAmount) || 0;
  const taxRateValue = Math.min(Math.max(Number.parseFloat(formState.orderTaxRate) || 0, 0), 100);
  const taxableAmount = Math.max(baseAmount - discountAmount, 0);
  const taxAmount = (taxRateValue / 100) * taxableAmount;
  const orderTotal = Math.max(taxableAmount + shippingAmount + taxAmount, 0);
  const taxRateSelectValue = useCustomTaxRate
    ? 'custom'
    : taxRateOptions.includes(formState.orderTaxRate as (typeof taxRateOptions)[number])
      ? formState.orderTaxRate
      : '';
  const itemSummaries = items
    .filter(hasItemData)
    .map((item, index) => {
      const name =
        item.itemType === 'catalog'
          ? item.productName
            ? `Catalog: ${item.productName}`
            : 'Catalog item'
          : item.productName || item.sku || `Item ${index + 1}`;

      return {
        key: item.id ?? `${item.productId ?? item.productCatalogId ?? 'item'}-${index}`,
        name,
        quantity: Number.parseInt(item.quantity, 10) || 0,
        total: calculateItemTotal(item),
      };
    });
  const hasItemSummaries = itemSummaries.length > 0;

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <OrderFormItems
              items={items}
              itemErrors={errors.items}
              onAddItem={addItem}
              onAddCatalogItem={addCatalogItem}
              onRemoveItem={removeItem}
              onItemChange={handleItemChange}
            />

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
                orderStatusOptions={orderStatusSelectOptions as any}
                paymentStatusOptions={paymentStatusSelectOptions as any}
                userTypeOptions={userTypeSelectOptions as any}
                shippingMethodOptions={shippingMethodSelectOptions as any}
                notificationTypeOptions={notificationTypeSelectOptions as any}
                onChange={handleChange}
                onVerifyDiscount={handleVerifyDiscount}
              />
            </div>

            <OrderFormAddress
              address={address}
              errors={errors}
              onAddressChange={handleAddressChange}
              onToggleBillToSame={toggleBillToSame}
              shippingEditable={shippingEditable}
              onToggleShippingEditable={setShippingEditable}
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
                    <span className="text-sm font-medium text-slate-600">Items Subtotal</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        ₹{itemsTotal.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowItemsBreakdown((prev) => !prev)}
                        disabled={!hasItemSummaries}
                        aria-expanded={showItemsBreakdown}
                        aria-controls="order-items-breakdown"
                        className="rounded-sm p-1 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${showItemsBreakdown ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                  {showItemsBreakdown && hasItemSummaries && (
                    <div id="order-items-breakdown" className="border-b border-yellow-500/20 pb-2">
                      <div className="space-y-1 text-xs">
                        {itemSummaries.map((item) => (
                          <div key={item.key} className="flex items-center justify-between text-slate-700">
                            <span className="truncate">{item.name}</span>
                            <span className="font-semibold text-slate-800">
                              Qty {item.quantity} • ₹{item.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">Tax</span>
                    <div className="flex flex-1 flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Select value={taxRateSelectValue} onValueChange={handleTaxRateSelect}>
                          <SelectTrigger className="h-8 w-[120px] border-yellow-500/30 bg-white text-xs">
                            <SelectValue placeholder="Select %" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRateOptions.map((rate) => (
                              <SelectItem key={rate} value={rate}>
                                {rate}%
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-semibold text-slate-800">
                          ₹{taxAmount.toFixed(2)}
                        </span>
                      </div>
                      {useCustomTaxRate && (
                        <div className="w-[120px]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            placeholder="Custom %"
                            value={formState.orderTaxRate}
                            onChange={(event) => {
                              setUseCustomTaxRate(true);
                              handleChange('orderTaxRate', event.target.value);
                            }}
                            className="h-8 border-yellow-500/30 bg-white text-xs"
                          />
                          <FieldError message={errors.orderTaxRate} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">Shipping</span>
                    <span className="font-semibold text-slate-800">
                      ₹{shippingAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">{discountLabel}</span>
                    <span className="font-semibold text-red-600">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 p-3">
                    <span className="font-bold text-slate-900">Order Total</span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{orderTotal.toFixed(2)}
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
              />
            </div>
          </div>
        </div>
      </form>
      <AlertDialog open={showEmptyCartDialog} onOpenChange={setShowEmptyCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cart is empty</AlertDialogTitle>
            <AlertDialogDescription>
              At least one item should be available in the cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowEmptyCartDialog(false)}>
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
