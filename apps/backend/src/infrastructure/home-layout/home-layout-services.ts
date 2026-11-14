import { prisma } from "@/infrastructure/prisma-client";
import { PrismaHomeLayoutRepository } from "./prisma-home-layout.repository";

export const homeLayoutRepository = new PrismaHomeLayoutRepository(prisma);
