export interface IChannelType {
  id?: number;
  name?: string;
  description?: string | null;
  remark?: string | null;
  tenantId?: string;
}

export const defaultValue: Readonly<IChannelType> = {};
