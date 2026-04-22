export interface IRepository<T, TCreate, TUpdate = Partial<TCreate>> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}
