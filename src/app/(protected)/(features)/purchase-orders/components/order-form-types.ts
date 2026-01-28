import type {
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
} from '../data/purchase-order-data';

type OptionalSelectValue<T extends string> = T | '';

export type OrderFormState = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  orderBaseAmount: string;
  shippingAmount: string;
  orderTaxRate: string;
  customerId: string;
  shippingMethod: OptionalSelectValue<ShippingMethod>;
  shippingId?: string;
  orderComment?: string;
};

export type OrderItemForm = {
  id?: number;
  itemType: 'product' | 'catalog';
  productId?: number;
  variantId?: number;
  productCatalogId?: number;
  productName?: string;
  sku?: string;
  variantAttributes?: string;
  itemStatus: string;
  quantity: string;
  itemPrice: string;
  itemTaxAmount: string;
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
  shippingAmount?: string;
  orderTaxRate?: string;
  customerId?: string;
  shippingId?: string;
  shipToZipcode?: string;
  billToZipcode?: string;
  shipToContact?: string;
  billToContact?: string;
  items?: ItemErrors[];
};
