export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type UserType = 'B2C' | 'B2B' | 'Guest';

export interface OrderDetailItem {
  orderDetailId: number;
  orderId: number;
  itemId: number;
  itemStatus: string;
  itemTotalAmount: number;
  quantity: number;
  itemPrice: number;
  itemTaxAmount: number;
  discountType?: string;
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
  notificationSent?: string;
  createdDate: string;
  createdBy: string;
  updatedBy?: string;
  lastUpdated?: string;
}

export interface AddressFields {
  firstName: string;
  middleName?: string;
  lastName: string;
  addrLine1: string;
  addrLine2?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
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
  orderTotalAmount: number;
  orderBaseAmount: number;
  discountAmount: number;
  shippingAmount: number;
  userType: UserType;
  phone: string;
  email: string;
  paymentStatus: PaymentStatus;
  discountType?: string;
  discountCode?: string;
  busyFlag?: boolean;
  busyVoucherId?: string;
  notificationType?: string;
  shippingMethod?: string;
  shippingId?: string;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  lastUpdated?: string;
  items: OrderDetailItem[];
  history: OrderHistoryEntry[];
  address: OrderAddressDetail;
}

export const orderStatusOptions: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const paymentStatusOptions: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'Refunded'];

export const shippingMethods = ['Courier', 'In-Store Pickup', 'Postal', 'Express'] as const;

export const mockOrders: OrderRecord[] = [
  {
    orderId: 450120,
    orderStatus: 'Processing',
    orderTotalAmount: 1899.5,
    orderBaseAmount: 1999.5,
    discountAmount: 100,
    shippingAmount: 35,
    userType: 'B2C',
    phone: '+1 (404) 555-2201',
    email: 'maya.patel@example.com',
    paymentStatus: 'Paid',
    discountType: 'Seasonal',
    discountCode: 'SPRING24',
    busyFlag: false,
    busyVoucherId: 'GV-14892',
    notificationType: 'Email',
    shippingMethod: 'Courier',
    shippingId: 'SHIP-9944',
    createdBy: 'Rajesh Kumar',
    createdDate: '2024-05-10T10:30:00Z',
    updatedBy: 'Priya Iyer',
    lastUpdated: '2024-05-12T08:10:00Z',
    items: [
      {
        orderDetailId: 1,
        orderId: 450120,
        itemId: 34211,
        itemStatus: 'Committed',
        itemTotalAmount: 899.75,
        quantity: 1,
        itemPrice: 899.75,
        itemTaxAmount: 74.15,
        discountType: 'Promo',
        discountCode: 'WELCOME',
        discountAmount: 50,
        itemComment: 'Gift wrap requested',
        createdBy: 'Rajesh Kumar',
        createdDate: '2024-05-10T10:31:00Z',
        lastUpdated: '2024-05-10T10:31:00Z',
      },
      {
        orderDetailId: 2,
        orderId: 450120,
        itemId: 34212,
        itemStatus: 'Committed',
        itemTotalAmount: 999.75,
        quantity: 2,
        itemPrice: 499.87,
        itemTaxAmount: 82.15,
        discountType: 'Bundle',
        discountCode: 'BUNDLE2',
        discountAmount: 50,
        itemComment: 'Color: Midnight Blue',
        createdBy: 'Rajesh Kumar',
        createdDate: '2024-05-10T10:31:00Z',
        updatedBy: 'Priya Iyer',
        lastUpdated: '2024-05-11T09:12:00Z',
      },
    ],
    history: [
      {
        orderHistoryId: 11,
        orderId: 450120,
        itemId: 34211,
        itemStatus: 'Committed',
        status: 'Created',
        notificationSent: 'Email',
        createdDate: '2024-05-10T10:30:00Z',
        createdBy: 'Rajesh Kumar',
        lastUpdated: '2024-05-10T10:30:00Z',
      },
      {
        orderHistoryId: 12,
        orderId: 450120,
        itemId: 34211,
        itemStatus: 'Committed',
        status: 'Payment Confirmed',
        notificationSent: 'Email',
        createdDate: '2024-05-10T10:32:00Z',
        createdBy: 'System',
        updatedBy: 'System',
        lastUpdated: '2024-05-10T10:32:00Z',
      },
      {
        orderHistoryId: 13,
        orderId: 450120,
        status: 'Processing',
        notificationSent: 'Push',
        createdDate: '2024-05-11T07:22:00Z',
        createdBy: 'Priya Iyer',
        updatedBy: 'Priya Iyer',
        lastUpdated: '2024-05-11T07:22:00Z',
      },
    ],
    address: {
      orderId: 450120,
      shipTo: {
        firstName: 'Maya',
        lastName: 'Patel',
        addrLine1: '77 Edgewood Ave',
        addrLine2: 'Apt 14B',
        city: 'Atlanta',
        state: 'GA',
        zipcode: '30303',
        country: 'USA',
        phone: '+1 (404) 555-2201',
        email: 'maya.patel@example.com',
      },
      billTo: {
        firstName: 'Maya',
        lastName: 'Patel',
        addrLine1: '77 Edgewood Ave',
        addrLine2: 'Apt 14B',
        city: 'Atlanta',
        state: 'GA',
        zipcode: '30303',
        country: 'USA',
        phone: '+1 (404) 555-2201',
        email: 'billing@patel.io',
      },
      billToSameAsShip: true,
      createdBy: 'Rajesh Kumar',
      createdDate: '2024-05-10T10:30:00Z',
      updatedBy: 'Priya Iyer',
      lastUpdated: '2024-05-12T08:10:00Z',
    },
  },
  {
    orderId: 450121,
    orderStatus: 'Shipped',
    orderTotalAmount: 1299.99,
    orderBaseAmount: 1399.99,
    discountAmount: 100,
    shippingAmount: 25,
    userType: 'B2B',
    phone: '+44 20 7946 0992',
    email: 'ops@northbridge.co.uk',
    paymentStatus: 'Paid',
    discountType: 'Voucher',
    discountCode: 'NB-OFF10',
    busyFlag: true,
    busyVoucherId: 'GV-22219',
    notificationType: 'SMS',
    shippingMethod: 'Express',
    shippingId: 'SHIP-4123',
    createdBy: 'Jonas Lind',
    createdDate: '2024-04-22T12:15:00Z',
    updatedBy: 'Jonas Lind',
    lastUpdated: '2024-04-23T09:00:00Z',
    items: [
      {
        orderDetailId: 3,
        orderId: 450121,
        itemId: 71001,
        itemStatus: 'Packed',
        itemTotalAmount: 799.99,
        quantity: 4,
        itemPrice: 199.99,
        itemTaxAmount: 64.15,
        discountType: 'Volume',
        discountCode: 'VOLUME4',
        discountAmount: 50,
        itemComment: 'Priority handling',
        createdBy: 'Jonas Lind',
        createdDate: '2024-04-22T12:20:00Z',
        lastUpdated: '2024-04-22T12:20:00Z',
      },
      {
        orderDetailId: 4,
        orderId: 450121,
        itemId: 71002,
        itemStatus: 'Packed',
        itemTotalAmount: 500,
        quantity: 10,
        itemPrice: 50,
        itemTaxAmount: 35.5,
        discountType: 'Promo',
        discountCode: 'SPRING24',
        discountAmount: 25,
        itemComment: 'White label packaging',
        createdBy: 'Jonas Lind',
        createdDate: '2024-04-22T12:22:00Z',
        updatedBy: 'Warehouse',
        lastUpdated: '2024-04-22T16:05:00Z',
      },
    ],
    history: [
      {
        orderHistoryId: 21,
        orderId: 450121,
        status: 'Created',
        itemStatus: 'Pending',
        createdDate: '2024-04-22T12:15:00Z',
        createdBy: 'Jonas Lind',
      },
      {
        orderHistoryId: 22,
        orderId: 450121,
        status: 'Packed',
        itemStatus: 'Packed',
        notificationSent: 'SMS',
        createdDate: '2024-04-22T16:10:00Z',
        createdBy: 'Warehouse',
        updatedBy: 'Warehouse',
      },
      {
        orderHistoryId: 23,
        orderId: 450121,
        status: 'Shipped',
        notificationSent: 'SMS',
        createdDate: '2024-04-23T08:50:00Z',
        createdBy: 'Logistics',
        updatedBy: 'Logistics',
      },
    ],
    address: {
      orderId: 450121,
      shipTo: {
        firstName: 'Northbridge',
        lastName: 'Logistics',
        addrLine1: '11 Bishopsgate',
        addrLine2: 'Suite 5C',
        city: 'London',
        state: 'London',
        zipcode: 'EC2N 3AJ',
        country: 'United Kingdom',
        phone: '+44 20 7946 0992',
        email: 'ops@northbridge.co.uk',
      },
      billTo: {
        firstName: 'Northbridge',
        lastName: 'Finance',
        addrLine1: '11 Bishopsgate',
        addrLine2: 'Suite 2A',
        city: 'London',
        state: 'London',
        zipcode: 'EC2N 3AJ',
        country: 'United Kingdom',
        phone: '+44 20 7946 0992',
        email: 'finance@northbridge.co.uk',
      },
      billToSameAsShip: false,
      createdBy: 'Jonas Lind',
      createdDate: '2024-04-22T12:15:00Z',
      updatedBy: 'Jonas Lind',
      lastUpdated: '2024-04-23T09:00:00Z',
    },
  },
  {
    orderId: 450122,
    orderStatus: 'Pending',
    orderTotalAmount: 349.5,
    orderBaseAmount: 349.5,
    discountAmount: 0,
    shippingAmount: 0,
    userType: 'Guest',
    phone: '+91 98765 44120',
    email: 'guest.checkout@example.com',
    paymentStatus: 'Pending',
    discountType: 'None',
    busyFlag: false,
    notificationType: 'Email',
    shippingMethod: 'In-Store Pickup',
    createdBy: 'Guest User',
    createdDate: '2024-05-16T09:05:00Z',
    lastUpdated: '2024-05-16T09:05:00Z',
    items: [
      {
        orderDetailId: 5,
        orderId: 450122,
        itemId: 82001,
        itemStatus: 'Reserved',
        itemTotalAmount: 349.5,
        quantity: 1,
        itemPrice: 349.5,
        itemTaxAmount: 28,
        itemComment: 'Pickup at Mumbai store',
        createdBy: 'Guest User',
        createdDate: '2024-05-16T09:05:00Z',
        lastUpdated: '2024-05-16T09:05:00Z',
      },
    ],
    history: [
      {
        orderHistoryId: 31,
        orderId: 450122,
        status: 'Created',
        itemStatus: 'Reserved',
        createdDate: '2024-05-16T09:05:00Z',
        createdBy: 'Guest User',
      },
    ],
    address: {
      orderId: 450122,
      shipTo: {
        firstName: 'Guest',
        lastName: 'User',
        addrLine1: 'Store Pickup',
        addrLine2: 'Bandra Outlet',
        city: 'Mumbai',
        state: 'MH',
        zipcode: '400050',
        country: 'India',
        phone: '+91 98765 44120',
        email: 'guest.checkout@example.com',
      },
      billTo: {
        firstName: 'Guest',
        lastName: 'User',
        addrLine1: 'Store Pickup',
        addrLine2: 'Bandra Outlet',
        city: 'Mumbai',
        state: 'MH',
        zipcode: '400050',
        country: 'India',
        phone: '+91 98765 44120',
        email: 'guest.checkout@example.com',
      },
      billToSameAsShip: true,
      createdBy: 'Guest User',
      createdDate: '2024-05-16T09:05:00Z',
      lastUpdated: '2024-05-16T09:05:00Z',
    },
  },
];
