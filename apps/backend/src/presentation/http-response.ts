import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

// Envelope shape per docs/00-system-architecture.md "API Standards" —
// see docs/04-api-modules.md §1 for why `success` is the discriminator
// and `traceId` exists. One helper, used by every route handler, so no
// route assembles this shape by hand.

interface Pagination {
  cursor: string | null;
  limit: number;
}

export function ok<T>(
  data: T,
  init?: { status?: number; message?: string; pagination?: Pagination; metadata?: Record<string, unknown> },
) {
  return NextResponse.json(
    {
      success: true,
      message: init?.message ?? null,
      data,
      pagination: init?.pagination ?? undefined,
      metadata: init?.metadata ?? undefined,
    },
    { status: init?.status ?? 200 },
  );
}

export function fail(
  errorCode: string,
  message: string,
  init?: { status?: number; details?: unknown },
) {
  return NextResponse.json(
    {
      success: false,
      errorCode,
      message,
      details: init?.details,
      traceId: randomUUID(),
      timestamp: new Date().toISOString(),
    },
    { status: init?.status ?? 400 },
  );
}
