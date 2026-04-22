import type { CreatePhaseReached, PhaseId, PhaseReached } from '@/lib/schemas';

import type { IRepository } from './IRepository';

export interface IPhaseReachedRepository extends IRepository<
  PhaseReached,
  CreatePhaseReached,
  never
> {
  findByFastSessionId(fastSessionId: string): Promise<PhaseReached[]>;
  findByUserId(userId: string): Promise<PhaseReached[]>;
  hasReachedPhase(fastSessionId: string, phaseId: PhaseId): Promise<boolean>;
}
