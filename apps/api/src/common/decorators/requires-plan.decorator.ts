import { SetMetadata } from '@nestjs/common';
import { PlanType } from '@prisma/client';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

/**
 * Decorator to specify the minimum plan required to access an endpoint.
 * Use with FeatureGuard to enforce plan-based access control.
 *
 * Plan hierarchy: BASIC < PRO < PREMIUM
 *
 * @example
 * @RequiresPlan(PlanType.PRO)
 * @Post('offers')
 * createOffer() {}
 */
export const RequiresPlan = (plan: PlanType) =>
  SetMetadata(REQUIRED_PLAN_KEY, plan);
