import type {
  OrderAddressDetailDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderHistoryDTO,
} from '@/core/api/generated/spring/schemas';

const UNKNOWN_LABEL = 'Unknown';

export const orderStatusOptions = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

export const paymentStatusOptions = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;

export const userTypeOptions = ['B2C', 'B2B', 'Guest'] as const;

export const shippingMethodOptions = ['Courier', 'In-Store Pickup', 'Postal', 'Express'] as const;

export const discountTypeOptions = ['Promo', 'Seasonal', 'Bundle', 'Voucher'] as const;

export const notificationTypeOptions = ['Email', 'SMS', 'Push'] as const;

export type OrderStatus = (typeof orderStatusOptions)[number] | typeof UNKNOWN_LABEL;
export type PaymentStatus = (typeof paymentStatusOptions)[number] | typeof UNKNOWN_LABEL;
export type UserType = (typeof userTypeOptions)[number] | typeof UNKNOWN_LABEL;
export type ShippingMethod = (typeof shippingMethodOptions)[number] | typeof UNKNOWN_LABEL;
export type DiscountType = (typeof discountTypeOptions)[number] | typeof UNKNOWN_LABEL;
export type NotificationType = (typeof notificationTypeOptions)[number] | typeof UNKNOWN_LABEL;

export interface OrderDetailItem {
  orderDetailId: number;
  orderId: number;
  productId?: number;
  variantId?: number;
  productName?: string;
  sku?: string;
  variantAttributes?: string;
  itemStatus: string;
  itemStatusCode?: number;
  itemTotalAmount: number;
  quantity: number;
  itemPrice: number;
  itemTaxAmount: number;
  discountType?: DiscountType;
  discountCode?: string;
  discountAmount?: number;
  itemComment?: string;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
}

export interface OrderHistoryEntry {
  orderHistoryId: number;
  orderId: number;
  itemId?: number;
  itemStatus?: string;
  status: string;
  notificationSent?: boolean;
  createdDate: string;
  createdBy: string;
  updatedBy?: string;
  lastUpdated?: string;
}

export interface AddressFields {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  addrLine1?: string;
  addrLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface OrderAddressDetail {
  orderId: number;
  shipTo: AddressFields;
  billTo: AddressFields;
  billToSameAsShip: boolean;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
}

export interface OrderRecord {
  orderId: number;
  orderStatus: OrderStatus;
  orderStatusCode?: number;
  orderTotalAmount: number;
  orderBaseAmount: number;
  discountAmount: number;
  shippingAmount: number;
  userType: UserType;
  userTypeCode?: number;
  phone: string;
  email: string;
  paymentStatus: PaymentStatus;
  paymentStatusCode?: number;
  discountType?: DiscountType;
  discountTypeCode?: number;
  discountCode?: string;
  busyFlag?: boolean;
  busyVoucherId?: string;
  notificationType?: NotificationType;
  notificationTypeCode?: number;
  shippingMethod?: ShippingMethod;
  shippingMethodCode?: number;
  shippingId?: string;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
  items: OrderDetailItem[];
  history: OrderHistoryEntry[];
  address: OrderAddressDetail;
}

const getLabelFromCode = (options: readonly string[], code?: number) => {
  if (typeof code !== 'number') return UNKNOWN_LABEL;
  return options[code] ?? UNKNOWN_LABEL;
};

const getCodeFromLabel = (options: readonly string[], label?: string) => {
  if (!label || label === UNKNOWN_LABEL) return undefined;
  const index = options.indexOf(label);
  return index === -1 ? undefined : index;
};

export const getOrderStatusLabel = (code?: number): OrderStatus =>
  getLabelFromCode(orderStatusOptions, code) as OrderStatus;

export const getOrderStatusCode = (status?: OrderStatus) =>
  getCodeFromLabel(orderStatusOptions, status);

export const getPaymentStatusLabel = (code?: number): PaymentStatus =>
  getLabelFromCode(paymentStatusOptions, code) as PaymentStatus;

export const getPaymentStatusCode = (status?: PaymentStatus) =>
  getCodeFromLabel(paymentStatusOptions, status);

export const getUserTypeLabel = (code?: number): UserType =>
  getLabelFromCode(userTypeOptions, code) as UserType;

export const getUserTypeCode = (status?: UserType) => getCodeFromLabel(userTypeOptions, status);

export const getShippingMethodLabel = (code?: number): ShippingMethod =>
  getLabelFromCode(shippingMethodOptions, code) as ShippingMethod;

export const getShippingMethodCode = (status?: ShippingMethod) =>
  getCodeFromLabel(shippingMethodOptions, status);

export const getDiscountTypeLabel = (code?: number): DiscountType =>
  getLabelFromCode(discountTypeOptions, code) as DiscountType;

export const getDiscountTypeCode = (status?: DiscountType) =>
  getCodeFromLabel(discountTypeOptions, status);

export const getNotificationTypeLabel = (code?: number): NotificationType =>
  getLabelFromCode(notificationTypeOptions, code) as NotificationType;

export const getNotificationTypeCode = (status?: NotificationType) =>
  getCodeFromLabel(notificationTypeOptions, status);

const resolveOrderTotal = (order: OrderDTO) => {
  if (typeof order.orderTotalAmount === 'number') {
    return order.orderTotalAmount;
  }

  const base = order.orderBaseAmount ?? 0;
  const discount = order.discountAmount ?? 0;
  const shipping = order.shippingAmount ?? 0;
  return Math.max(base - discount + shipping, 0);
};

const toStringValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export const mapOrderDtoToRecord = (order: OrderDTO): OrderRecord => {
  const orderStatusCode = order.orderStatus ?? undefined;
  const paymentStatusCode = order.paymentStatus ?? undefined;
  const userTypeCode = order.userType ?? undefined;
  const discountTypeCode = order.discountType ?? undefined;
  const notificationTypeCode = order.notificationType ?? undefined;
  const shippingMethodCode = order.shippingMethod ?? undefined;

  return {
    orderId: order.id ?? 0,
    orderStatus: getOrderStatusLabel(orderStatusCode),
    orderStatusCode,
    orderTotalAmount: resolveOrderTotal(order),
    orderBaseAmount: order.orderBaseAmount ?? 0,
    discountAmount: order.discountAmount ?? 0,
    shippingAmount: order.shippingAmount ?? 0,
    userType: getUserTypeLabel(userTypeCode),
    userTypeCode,
    phone: order.phone ?? '',
    email: order.email ?? '',
    paymentStatus: getPaymentStatusLabel(paymentStatusCode),
    paymentStatusCode,
    discountType:
      typeof order.discountType === 'number' ? getDiscountTypeLabel(discountTypeCode) : undefined,
    discountTypeCode,
    discountCode: order.discountCode ?? undefined,
    busyFlag: Boolean(order.busyFlag),
    busyVoucherId: order.busyVoucherId ?? undefined,
    notificationType:
      typeof order.notificationType === 'number'
        ? getNotificationTypeLabel(notificationTypeCode)
        : undefined,
    notificationTypeCode,
    shippingMethod:
      typeof order.shippingMethod === 'number'
        ? getShippingMethodLabel(shippingMethodCode)
        : undefined,
    shippingMethodCode,
    shippingId: order.shippingId ?? undefined,
    createdBy: order.createdBy ?? 'System',
    createdDate: order.createdDate ?? '',
    updatedBy: toStringValue(order.updatedBy) || undefined,
    lastUpdated: order.lastUpdated ?? undefined,
    items: [],
    history: [],
    address: {
      orderId: order.id ?? 0,
      shipTo: {},
      billTo: {},
      billToSameAsShip: false,
      createdBy: order.createdBy ?? 'System',
      createdDate: order.createdDate ?? '',
      updatedBy: toStringValue(order.updatedBy) || undefined,
      lastUpdated: order.lastUpdated ?? undefined,
    },
  };
};

export const mapOrderDetailDto = (detail: OrderDetailDTO): OrderDetailItem => {
  const itemStatusCode = typeof detail.itemStatus === 'number' ? detail.itemStatus : undefined;
  const itemStatus = itemStatusCode !== undefined ? `Status ${itemStatusCode}` : UNKNOWN_LABEL;
  const discountType =
    typeof detail.discountType === 'number' ? getDiscountTypeLabel(detail.discountType) : undefined;

  return {
    orderDetailId: detail.id ?? 0,
    orderId: detail.orderId ?? 0,
    productId: detail.productId ?? undefined,
    variantId: detail.variantId ?? undefined,
    productName: detail.productName ?? undefined,
    sku: detail.sku ?? undefined,
    variantAttributes: detail.variantAttributes ?? undefined,
    itemStatus,
    itemStatusCode,
    itemTotalAmount: detail.itemTotalAmount ?? 0,
    quantity: detail.quantity ?? 0,
    itemPrice: detail.itemPrice ?? 0,
    itemTaxAmount: detail.itemTaxAmount ?? 0,
    discountType,
    discountCode: detail.discountCode ?? undefined,
    discountAmount: detail.discountAmount ?? undefined,
    itemComment: detail.itemComment ?? undefined,
    createdBy: detail.createdBy ?? 'System',
    createdDate: detail.createdDate ?? '',
    updatedBy: detail.updatedBy ?? undefined,
    lastUpdated: detail.lastUpdated ?? undefined,
  };
};

export const mapOrderHistoryDto = (history: OrderHistoryDTO): OrderHistoryEntry => ({
  orderHistoryId: history.id ?? 0,
  orderId: history.orderId ?? 0,
  status: history.status ?? 'Updated',
  notificationSent: history.notificationSent ?? undefined,
  createdDate: history.createdDate ?? '',
  createdBy: history.createdBy ?? 'System',
  updatedBy: history.updatedBy ?? undefined,
  lastUpdated: history.lastUpdated ?? undefined,
});

export const mapOrderAddressDetail = (
  address: OrderAddressDetailDTO | undefined,
  order?: OrderDTO
): OrderAddressDetail => ({
  orderId: address?.orderId ?? order?.id ?? 0,
  shipTo: {
    firstName: address?.shipToFirstName ?? undefined,
    middleName: address?.shipToMiddleName ?? undefined,
    lastName: address?.shipToLastName ?? undefined,
    addrLine1: address?.shipToAddLine1 ?? undefined,
    addrLine2: address?.shipToAddLine2 ?? undefined,
    city: address?.shipToCity ?? undefined,
    state: address?.shipToState ?? undefined,
    zipcode: address?.shipToZipcode ?? undefined,
    country: address?.shipToCountry ?? undefined,
    phone: address?.shipToContact ?? undefined,
    email: order?.email ?? undefined,
  },
  billTo: {
    firstName: address?.billToFirstName ?? undefined,
    middleName: address?.billToMiddleName ?? undefined,
    lastName: address?.billToLastName ?? undefined,
    addrLine1: address?.billToAddLine1 ?? undefined,
    addrLine2: address?.billToAddLine2 ?? undefined,
    city: address?.billToCity ?? undefined,
    state: address?.billToState ?? undefined,
    zipcode: address?.billToZipcode ?? undefined,
    country: address?.billToCountry ?? undefined,
    phone: address?.billToContact ?? undefined,
    email: order?.email ?? undefined,
  },
  billToSameAsShip: Boolean(address?.billToSameFlag),
  createdBy: address?.createdBy ?? order?.createdBy ?? 'System',
  createdDate: address?.createdDate ?? order?.createdDate ?? '',
  updatedBy: address?.updatedBy ?? (toStringValue(order?.updatedBy) || undefined),
  lastUpdated: address?.lastUpdated ?? order?.lastUpdated ?? undefined,
});

export const mapOrderDetails = (details?: OrderDetailDTO[]) =>
  details ? details.map(mapOrderDetailDto) : [];

export const mapOrderHistoryEntries = (entries?: OrderHistoryDTO[]) =>
  entries ? entries.map(mapOrderHistoryDto) : [];
