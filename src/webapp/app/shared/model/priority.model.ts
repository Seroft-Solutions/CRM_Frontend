export interface IPriority {
  id?: number;
  name?: string;
  description?: string | null;
  remark?: string | null;
}

export const defaultValue: Readonly<IPriority> = {};
