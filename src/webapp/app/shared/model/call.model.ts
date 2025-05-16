import { IUser } from 'app/shared/model/user.model';
import { IPriority } from 'app/shared/model/priority.model';
import { ICallType } from 'app/shared/model/call-type.model';
import { ISubCallType } from 'app/shared/model/sub-call-type.model';
import { ISource } from 'app/shared/model/source.model';
import { ICity } from 'app/shared/model/city.model';
import { IParty } from 'app/shared/model/party.model';
import { IProduct } from 'app/shared/model/product.model';
import { IChannelType } from 'app/shared/model/channel-type.model';
import { ICallCategory } from 'app/shared/model/call-category.model';
import { ICallStatus } from 'app/shared/model/call-status.model';
import { Status } from 'app/shared/model/enumerations/status.model';

export interface ICall {
  id?: number;
  status?: keyof typeof Status | null;
  tenantId?: string;
  assignedTo?: IUser | null;
  channelParty?: IUser | null;
  priority?: IPriority | null;
  callType?: ICallType | null;
  subCallType?: ISubCallType | null;
  source?: ISource | null;
  area?: ICity | null;
  party?: IParty | null;
  product?: IProduct | null;
  channelType?: IChannelType | null;
  callCategory?: ICallCategory | null;
  callStatus?: ICallStatus | null;
}

export const defaultValue: Readonly<ICall> = {};
