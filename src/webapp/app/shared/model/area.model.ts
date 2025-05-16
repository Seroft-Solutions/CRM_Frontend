import { ICity } from 'app/shared/model/city.model';

export interface IArea {
  id?: number;
  name?: string;
  pincode?: number;
  city?: ICity | null;
}

export const defaultValue: Readonly<IArea> = {};
