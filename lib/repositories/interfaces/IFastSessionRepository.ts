import type {
  CreateFastSession,
  FastSession,
  FastSessionStatus,
  UpdateFastSession,
} from '@/lib/schemas';

import type { IRepository } from './IRepository';

export interface IFastSessionRepository extends IRepository<
  FastSession,
  CreateFastSession,
  UpdateFastSession
> {
  findByUserId(userId: string): Promise<FastSession[]>;
  findActiveByUserId(userId: string): Promise<FastSession | null>;
  findByStatus(userId: string, status: FastSessionStatus): Promise<FastSession[]>;
  /** Returns sessions ordered by startedAt DESC with optional limit */
  findRecentByUserId(userId: string, limit: number): Promise<FastSession[]>;
}
