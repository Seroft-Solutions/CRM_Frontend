import type {
  DiscountMode,
  DiscountType,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
  UserType,
} from '../data/order-data';

type OptionalSelectValue<T extends string> = T | '';

export type OrderFormState = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  userType: UserType;
  orderBaseAmount: string;
  discountMode: OptionalSelectValue<DiscountMode>;
  discountValue: string;
  maxDiscountValue: string;
  discountStartDate: string;
  discountEndDate: string;
  shippingAmount: string;
  orderTaxRate: string;
  phone: string;
  email: string;
  shippingMethod: OptionalSelectValue<ShippingMethod>;
  shippingId?: string;
  discountType?: OptionalSelectValue<DiscountType>;
  discountCode?: string;
  notificationType?: OptionalSelectValue<NotificationType>;
  busyFlag: boolean;
  busyVoucherId?: string;
  orderComment?: string;
};

export type OrderItemForm = {
  id?: number;
  productId?: number;
  variantId?: number;
  productName?: string;
  sku?: string;
  variantAttributes?: string;
  itemStatus: string;
  quantity: string;
  itemPrice: string;
  itemTaxAmount: string;
  discountType?: OptionalSelectValue<DiscountType>;
  discountCode?: string;
  discountAmount?: string;
  itemComment?: string;
};

export type AddressFieldsForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  addrLine1: string;
  addrLine2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  contact: string;
};

export type OrderAddressForm = {
  shipTo: AddressFieldsForm;
  billTo: AddressFieldsForm;
  billToSameFlag: boolean;
};

export type ItemErrors = Partial<Record<keyof OrderItemForm, string>>;

export type OrderFormErrors = {
  orderBaseAmount?: string;
  discountMode?: string;
  discountValue?: string;
  maxDiscountValue?: string;
  discountStartDate?: string;
  discountEndDate?: string;
  shippingAmount?: string;
  orderTaxRate?: string;
  phone?: string;
  email?: string;
  shippingId?: string;
  discountCode?: string;
  busyVoucherId?: string;
  shipToZipcode?: string;
  billToZipcode?: string;
  shipToContact?: string;
  billToContact?: string;
  items?: ItemErrors[];
};
