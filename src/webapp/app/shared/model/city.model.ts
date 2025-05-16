import { IDistrict } from 'app/shared/model/district.model';

export interface ICity {
  id?: number;
  name?: string;
  district?: IDistrict | null;
}

export const defaultValue: Readonly<ICity> = {};
