import { ICity } from 'app/shared/model/city.model';

export interface IParty {
  id?: number;
  name?: string;
  mobile?: string | null;
  email?: string | null;
  whatsApp?: string | null;
  contactPerson?: string | null;
  address1?: string | null;
  address2?: string | null;
  address3?: string | null;
  remark?: string | null;
  tenantId?: string;
  city?: ICity | null;
}

export const defaultValue: Readonly<IParty> = {};
