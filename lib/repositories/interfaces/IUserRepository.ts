import type { CreateUser, UpdateUser, User } from '@/lib/schemas';

import type { IRepository } from './IRepository';

export interface IUserRepository extends IRepository<User, CreateUser, UpdateUser> {
  findByEmail(email: string): Promise<User | null>;
  /** Promotes a guest to a registered user (adds email + passwordHash, sets isGuest=false) */
  promoteGuestToRegistered(id: string, email: string, passwordHash: string): Promise<User>;
}
