import type { PrismaClient } from "@prisma/client";
import type { WorkflowActionContext, WorkflowActionExecutor, WorkflowActionResult } from "@/domain/workflow/workflow-action-executor";

// SEND_MESSAGE consolidates "Send Notification"/"Send Email" (ADR-009) —
// this reference implementation handles the IN_APP channel (a
// Notification row) directly; EMAIL/SMS channels enqueue onto the
// existing notificationQueue (infrastructure/jobs/queue.ts) rather than
// sending synchronously, omitted here for brevity.
export class SendMessageActionExecutor implements WorkflowActionExecutor {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(context: WorkflowActionContext): Promise<WorkflowActionResult> {
    const { userId, channel, title, body } = context.actionConfig as {
      userId: string;
      channel: string;
      title: string;
      body: string;
    };

    if (channel !== "IN_APP") {
      return { success: false, errorMessage: `Channel "${channel}" not handled by this reference executor` };
    }

    const notification = await this.prisma.notification.create({
      data: { userId, type: "workflow", title, body },
    });

    return { success: true, result: { notificationId: notification.id } };
  }
}
