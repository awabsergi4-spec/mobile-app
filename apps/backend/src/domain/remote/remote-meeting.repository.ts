export interface RemoteMeeting {
  id: string;
  engagementId: string;
  scheduledAt: Date;
  joinUrl: string | null;
}

export interface CreateRemoteMeetingInput {
  engagementId: string;
  scheduledAt: Date;
  joinUrl?: string;
}

// Interface only — implemented in infrastructure/remote/prisma-remote-meeting.repository.ts.
export interface RemoteMeetingRepository {
  create(input: CreateRemoteMeetingInput): Promise<RemoteMeeting>;
  listByEngagementId(engagementId: string): Promise<RemoteMeeting[]>;
}
