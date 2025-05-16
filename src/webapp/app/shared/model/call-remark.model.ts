import dayjs from 'dayjs';
import { ICall } from 'app/shared/model/call.model';

export interface ICallRemark {
  id?: number;
  remark?: string;
  dateTime?: dayjs.Dayjs;
  tenantId?: string;
  call?: ICall | null;
}

export const defaultValue: Readonly<ICallRemark> = {};
