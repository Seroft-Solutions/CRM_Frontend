import type {
  OrderAddressDetailDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderHistoryDTO,
} from '@/core/api/generated/spring/schemas';
import type { OrderDiscountDetailDTO } from '@/core/api/order-discount-detail';
import type { OrderShippingDetailDTO } from '@/core/api/order-shipping-detail';

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
export const discountModeOptions = ['Percentage', 'Amount'] as const;

export const notificationTypeOptions = ['Email', 'SMS', 'Push'] as const;

export type OrderStatus = (typeof orderStatusOptions)[number] | typeof UNKNOWN_LABEL;
export type PaymentStatus = (typeof paymentStatusOptions)[number] | typeof UNKNOWN_LABEL;
export type UserType = (typeof userTypeOptions)[number] | typeof UNKNOWN_LABEL;
export type ShippingMethod = (typeof shippingMethodOptions)[number] | typeof UNKNOWN_LABEL;
export type DiscountType = (typeof discountTypeOptions)[number] | typeof UNKNOWN_LABEL;
export type DiscountMode = (typeof discountModeOptions)[number] | typeof UNKNOWN_LABEL;
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

export interface OrderShippingDetail {
  orderId: number;
  shippingAmount: number;
  shippingMethod?: ShippingMethod;
  shippingMethodCode?: number;
  shippingId?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface OrderDiscountDetail {
  orderId: number;
  discountAmount: number;
  discountType?: DiscountType;
  discountTypeCode?: number;
  discountCode?: string;
  discountMode?: DiscountMode;
  discountModeCode?: number;
  discountValue: number;
  maxDiscountValue?: number;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface OrderRecord {
  orderId: number;
  orderStatus: OrderStatus;
  orderStatusCode?: number;
  orderTotalAmount: number;
  orderTaxRate: number;
  orderBaseAmount: number;
  userType: UserType;
  userTypeCode?: number;
  phone: string;
  email: string;
  paymentStatus: PaymentStatus;
  paymentStatusCode?: number;
  busyFlag?: boolean;
  busyVoucherId?: string;
  notificationType?: NotificationType;
  notificationTypeCode?: number;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
  items: OrderDetailItem[];
  history: OrderHistoryEntry[];
  address: OrderAddressDetail;
  shipping: OrderShippingDetail;
  discount: OrderDiscountDetail;
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

export const getDiscountModeLabel = (code?: number): DiscountMode =>
  getLabelFromCode(discountModeOptions, code) as DiscountMode;

export const getDiscountModeCode = (status?: DiscountMode) =>
  getCodeFromLabel(discountModeOptions, status);

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
  const taxRate = order.orderTaxRate ?? 0;
  const taxableAmount = Math.max(base - discount, 0);
  const taxAmount = (taxRate / 100) * taxableAmount;
  return Math.max(taxableAmount + shipping + taxAmount, 0);
};

const toStringValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export const mapOrderDtoToRecord = (order: OrderDTO): OrderRecord => {
  const orderStatusCode = order.orderStatus ?? undefined;
  const paymentStatusCode = order.paymentStatus ?? undefined;
  const userTypeCode = order.userType ?? undefined;
  const notificationTypeCode = order.notificationType ?? undefined;

  return {
    orderId: order.id ?? 0,
    orderStatus: getOrderStatusLabel(orderStatusCode),
    orderStatusCode,
    orderTotalAmount: resolveOrderTotal(order),
    orderTaxRate: order.orderTaxRate ?? 0,
    orderBaseAmount: order.orderBaseAmount ?? 0,
    userType: getUserTypeLabel(userTypeCode),
    userTypeCode,
    phone: order.phone ?? '',
    email: order.email ?? '',
    paymentStatus: getPaymentStatusLabel(paymentStatusCode),
    paymentStatusCode,
    busyFlag: Boolean(order.busyFlag),
    busyVoucherId: order.busyVoucherId ?? undefined,
    notificationType:
      typeof order.notificationType === 'number'
        ? getNotificationTypeLabel(notificationTypeCode)
        : undefined,
    notificationTypeCode,
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
    shipping: mapOrderShippingDetail(undefined, order),
    discount: mapOrderDiscountDetail(undefined, order),
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

export const mapOrderShippingDetail = (
  shipping: OrderShippingDetailDTO | undefined,
  order?: OrderDTO
): OrderShippingDetail => {
  const shippingMethodCode = shipping?.shippingMethod ?? undefined;

  return {
    orderId: shipping?.orderId ?? order?.id ?? 0,
    shippingAmount: shipping?.shippingAmount ?? 0,
    shippingMethod:
      typeof shipping?.shippingMethod === 'number'
        ? getShippingMethodLabel(shippingMethodCode)
        : undefined,
    shippingMethodCode,
    shippingId: shipping?.shippingId ?? undefined,
    createdBy: shipping?.createdBy ?? order?.createdBy ?? 'System',
    createdDate: shipping?.createdDate ?? order?.createdDate ?? '',
    lastModifiedBy: shipping?.lastModifiedBy ?? order?.lastModifiedBy ?? undefined,
    lastModifiedDate: shipping?.lastModifiedDate ?? order?.lastModifiedDate ?? undefined,
  };
};

export const mapOrderDiscountDetail = (
  discount: OrderDiscountDetailDTO | undefined,
  order?: OrderDTO
): OrderDiscountDetail => {
  const fallbackAmount = order?.discountAmount ?? 0;
  const discountTypeCode =
    discount?.discountType ?? (typeof order?.discountType === 'number' ? order.discountType : undefined);
  const discountModeCode =
    discount?.discountMode ?? (fallbackAmount ? getDiscountModeCode('Amount') : undefined);

  return {
    orderId: discount?.orderId ?? order?.id ?? 0,
    discountAmount: discount?.discountAmount ?? fallbackAmount ?? 0,
    discountType:
      typeof discountTypeCode === 'number' ? getDiscountTypeLabel(discountTypeCode) : undefined,
    discountTypeCode,
    discountCode: discount?.discountCode ?? order?.discountCode ?? undefined,
    discountMode:
      typeof discountModeCode === 'number' ? getDiscountModeLabel(discountModeCode) : undefined,
    discountModeCode,
    discountValue: discount?.discountValue ?? (fallbackAmount || 0),
    maxDiscountValue: discount?.maxDiscountValue ?? undefined,
    startDate: discount?.startDate ?? undefined,
    endDate: discount?.endDate ?? undefined,
    createdBy: discount?.createdBy ?? order?.createdBy ?? 'System',
    createdDate: discount?.createdDate ?? order?.createdDate ?? '',
    lastModifiedBy: discount?.lastModifiedBy ?? order?.lastModifiedBy ?? undefined,
    lastModifiedDate: discount?.lastModifiedDate ?? order?.lastModifiedDate ?? undefined,
  };
};

export const mapOrderDetails = (details?: OrderDetailDTO[]) =>
  details ? details.map(mapOrderDetailDto) : [];

export const mapOrderHistoryEntries = (entries?: OrderHistoryDTO[]) =>
  entries ? entries.map(mapOrderHistoryDto) : [];
