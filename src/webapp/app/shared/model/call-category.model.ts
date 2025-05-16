export interface ICallCategory {
  id?: number;
  name?: string;
  description?: string | null;
  remark?: string | null;
  tenantId?: string;
}

export const defaultValue: Readonly<ICallCategory> = {};
