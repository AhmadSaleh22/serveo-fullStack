import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanType } from '@prisma/client';
import { REQUIRED_PLAN_KEY } from '../decorators/requires-plan.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// Define plan hierarchy (higher index = more features)
const PLAN_HIERARCHY: PlanType[] = [
  PlanType.BASIC,
  PlanType.PRO,
  PlanType.PREMIUM,
];

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<PlanType>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no plan requirement is set, allow access
    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.restaurantId) {
      throw new ForbiddenException('No restaurant associated with this user');
    }

    // Fetch the restaurant's current plan
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { planType: true },
    });

    if (!restaurant) {
      throw new ForbiddenException('Restaurant not found');
    }

    const userPlanIndex = PLAN_HIERARCHY.indexOf(restaurant.planType);
    const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);

    if (userPlanIndex < requiredPlanIndex) {
      throw new ForbiddenException(
        `This feature requires a ${requiredPlan} plan. Your current plan is ${restaurant.planType}.`,
      );
    }

    return true;
  }
}
