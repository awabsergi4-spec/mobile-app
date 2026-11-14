import { prisma } from "@/infrastructure/prisma-client";
import { ledgerService } from "@/infrastructure/finance/finance-services";
import { PrismaDashboardMetricsService } from "./prisma-dashboard-metrics-service";

export const dashboardMetricsService = new PrismaDashboardMetricsService(prisma, ledgerService);
