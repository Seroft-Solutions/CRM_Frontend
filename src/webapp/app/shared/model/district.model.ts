import { IState } from 'app/shared/model/state.model';

export interface IDistrict {
  id?: number;
  name?: string;
  state?: IState | null;
}

export const defaultValue: Readonly<IDistrict> = {};
