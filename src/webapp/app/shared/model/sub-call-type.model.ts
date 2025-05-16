import { ICallType } from 'app/shared/model/call-type.model';

export interface ISubCallType {
  id?: number;
  name?: string;
  description?: string | null;
  remark?: string | null;
  tenantId?: string;
  callType?: ICallType | null;
}

export const defaultValue: Readonly<ISubCallType> = {};
