export interface IDiscount {
    id?: number;
    discountAmount?: number;
    discountType?: string;
    discountCode?: string;
    discountCategory?: string;
    discountValue?: number;
    startDate?: string;
    endDate?: string;
    maxDiscountValue?: number;
    description?: string;
    active?: boolean;
    createdBy?: string;
    createdDate?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
}

export type NewDiscount = Omit<IDiscount, 'id'> & { id: null };
