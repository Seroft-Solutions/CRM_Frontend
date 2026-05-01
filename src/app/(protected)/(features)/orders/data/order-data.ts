import type {
  OrderAddressDetailDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderHistoryDTO,
} from '@/core/api/generated/spring/schemas';
import type { OrderShippingDetailDTO } from '@/core/api/order-shipping-detail';

const UNKNOWN_LABEL = 'Unknown';

export const orderStatusOptions = [
  'Created',
  'Approved',
  'Processing',
  'Picked',
  'Packed',
  'Shipped',
  'Delivered',
  'Pending',
  'Cancelled',
] as const;

export const paymentStatusOptions = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;

export const shippingMethodOptions = ['Courier', 'In-Store Pickup', 'Postal', 'Express'] as const;

export type OrderStatus = (typeof orderStatusOptions)[number] | typeof UNKNOWN_LABEL;

export type PaymentStatus = (typeof paymentStatusOptions)[number] | typeof UNKNOWN_LABEL;

export type ShippingMethod = (typeof shippingMethodOptions)[number] | typeof UNKNOWN_LABEL;

const allowedOrderStatusTransitions: Record<
  Exclude<OrderStatus, typeof UNKNOWN_LABEL>,
  Exclude<OrderStatus, typeof UNKNOWN_LABEL>[]
> = {
  Created: ['Approved', 'Cancelled'],
  Processing: ['Pending', 'Approved', 'Picked', 'Packed', 'Shipped', 'Cancelled'],
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Pending', 'Shipped', 'Cancelled'],
  Picked: ['Packed', 'Shipped', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

const formatOrderStatusList = (statuses: readonly Exclude<OrderStatus, typeof UNKNOWN_LABEL>[]) => {
  if (statuses.length === 0) {
    return '';
  }

  if (statuses.length === 1) {
    return statuses[0];
  }

  return `${statuses.slice(0, -1).join(', ')} or ${statuses[statuses.length - 1]}`;
};

export function getNextAllowedOrderStatuses(currentStatus?: OrderStatus) {
  if (!currentStatus || currentStatus === UNKNOWN_LABEL) {
    return [...orderStatusOptions];
  }

  return allowedOrderStatusTransitions[currentStatus] ?? [];
}

export function getSelectableOrderStatuses(
  currentStatus?: OrderStatus,
  options?: { isEditing?: boolean; includeUnknown?: boolean }
): OrderStatus[] {
  if (!options?.isEditing) {
    return [options?.includeUnknown ? UNKNOWN_LABEL : 'Created'].filter(
      (status): status is OrderStatus => Boolean(status)
    );
  }

  if (!currentStatus || currentStatus === UNKNOWN_LABEL) {
    return options?.includeUnknown
      ? [...orderStatusOptions, UNKNOWN_LABEL]
      : [...orderStatusOptions];
  }

  return [currentStatus, ...getNextAllowedOrderStatuses(currentStatus)];
}

export function getOrderStatusTransitionError(
  currentStatus: OrderStatus | undefined,
  nextStatus: OrderStatus,
  options?: { isEditing?: boolean }
) {
  if (!options?.isEditing) {
    return nextStatus === 'Created' ? undefined : 'New orders must start with Created status.';
  }

  if (!currentStatus || currentStatus === UNKNOWN_LABEL || currentStatus === nextStatus) {
    return undefined;
  }

  const allowedStatuses = getNextAllowedOrderStatuses(currentStatus);

  if (allowedStatuses.includes(nextStatus)) {
    return undefined;
  }

  if (allowedStatuses.length === 0) {
    return currentStatus === 'Delivered'
      ? 'Delivered orders cannot change status.'
      : currentStatus === 'Cancelled'
        ? 'Cancelled orders cannot change status.'
        : `Orders in ${currentStatus} cannot change status.`;
  }

  return `Order status can only move from ${currentStatus} to ${formatOrderStatusList(allowedStatuses)}.`;
}

export interface OrderDetailItem {
  orderDetailId: number;
  orderId: number;
  productId?: number;
  variantId?: number;
  productCatalogId?: number;
  warehouseId?: number;
  productName?: string;
  sku?: string;
  variantAttributes?: string;
  itemStatus: string;
  itemStatusCode?: number;
  itemTotalAmount: number;
  quantity: number;
  backOrderQuantity: number;
  itemPrice: number;
  itemTaxAmount: number;
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

export interface OrderRecord {
  orderId: number;
  orderStatus: OrderStatus;
  orderStatusCode?: number;
  orderTotalAmount: number;
  orderTaxRate: number;
  orderBaseAmount: number;
  discountCode?: string;
  assignee?: string;
  picker?: string;
  packer?: string;
  customer?: OrderDTO['customer'];
  phone: string;
  email: string;
  paymentStatus: PaymentStatus;
  paymentStatusCode?: number;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
  lastModifiedDate?: string;
  items: OrderDetailItem[];
  history: OrderHistoryEntry[];
  address: OrderAddressDetail;
  shipping: OrderShippingDetail;
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

export const getShippingMethodLabel = (code?: number): ShippingMethod =>
  getLabelFromCode(shippingMethodOptions, code) as ShippingMethod;

export const getShippingMethodCode = (status?: ShippingMethod) =>
  getCodeFromLabel(shippingMethodOptions, status);

const resolveOrderTotal = (order: OrderDTO) => {
  if (typeof order.orderTotalAmount === 'number') {
    return order.orderTotalAmount;
  }

  const base = order.orderBaseAmount ?? 0;
  // Note: discountAmount is no longer in orderDTO, resolving via computation if needed elsewhere
  const shipping = order.shippingAmount ?? 0;
  const taxRate = order.orderTaxRate ?? 0;
  const taxableAmount = base; // simplified fallback
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

  return {
    orderId: order.id ?? 0,
    orderStatus: getOrderStatusLabel(orderStatusCode),
    orderStatusCode,
    orderTotalAmount: resolveOrderTotal(order),
    orderTaxRate: order.orderTaxRate ?? 0,
    orderBaseAmount: order.orderBaseAmount ?? 0,
    discountCode: order.discountCode ?? undefined,
    assignee: order.assignee ?? undefined,
    picker: order.picker ?? undefined,
    packer: order.packer ?? undefined,
    customer: order.customer ?? undefined,
    phone: order.phone ?? '',
    email: order.email ?? '',
    paymentStatus: getPaymentStatusLabel(paymentStatusCode),
    paymentStatusCode,
    // busyFlag: Boolean(order.busyFlag),
    // busyVoucherId: order.busyVoucherId ?? undefined,
    createdBy: order.createdBy ?? 'System',
    createdDate: order.createdDate ?? '',
    updatedBy: toStringValue(order.updatedBy) || undefined,
    lastUpdated: order.lastUpdated ?? undefined,
    lastModifiedDate: order.lastModifiedDate ?? undefined,
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
  };
};

export const mapOrderDetailDto = (detail: OrderDetailDTO): OrderDetailItem => {
  // const itemStatusCode = typeof detail.itemStatus === 'number' ? detail.itemStatus : undefined;
  // const itemStatus = itemStatusCode !== undefined ? `Status ${itemStatusCode}` : UNKNOWN_LABEL;
  const itemStatus = UNKNOWN_LABEL;
  const itemStatusCode = undefined;
  const quantity = (detail.quantity ?? 0) + (detail.backOrderQuantity ?? 0);

  return {
    orderDetailId: detail.id ?? 0,
    orderId: detail.orderId ?? 0,
    productId: detail.productId ?? undefined,
    variantId: detail.variantId ?? undefined,
    productCatalogId: detail.productCatalogId ?? undefined,
    warehouseId: detail.warehouseId ?? undefined,
    productName: detail.productName ?? undefined,
    sku: detail.sku ?? undefined,
    variantAttributes: detail.variantAttributes ?? undefined,
    itemStatus,
    itemStatusCode,
    itemTotalAmount: detail.itemTotalAmount ?? 0,
    quantity,
    backOrderQuantity: 0,
    itemPrice: detail.itemPrice ?? 0,
    itemTaxAmount: 0,
    itemComment: undefined,
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

export const mapOrderDetails = (details?: OrderDetailDTO[]) =>
  details ? details.map(mapOrderDetailDto) : [];

export const mapOrderHistoryEntries = (entries?: OrderHistoryDTO[]) =>
  entries ? entries.map(mapOrderHistoryDto) : [];
