import type { Prisma, PrismaClient } from "@prisma/client";
import type { DomainEventPublisher, PublishDomainEventInput } from "@/domain/workflow/domain-event-publisher";

export class PrismaDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly prisma: PrismaClient) {}

  async publish(input: PublishDomainEventInput): Promise<{ eventId: string }> {
    const event = await this.prisma.domainEvent.create({
      data: {
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
        relatedEntityType: input.relatedEntityType as never,
        relatedEntityId: input.relatedEntityId,
      },
    });

    // Enqueuing the workflowQueue job that matches active
    // WorkflowDefinition/AutomationRule rows against this event happens
    // here in a full implementation — omitted in this reference slice,
    // see docs/10-workflow-engine.md §7.
    return { eventId: event.id };
  }
}
