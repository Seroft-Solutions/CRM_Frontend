export interface ICallType {
  id?: number;
  name?: string;
  description?: string | null;
  remark?: string | null;
  tenantId?: string;
}

export const defaultValue: Readonly<ICallType> = {};
