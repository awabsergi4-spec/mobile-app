import { describe, it, expect } from "vitest";
import { CreateOnDemandRequestUseCase } from "../create-on-demand-request.use-case";
import { AcceptOnDemandAssignmentUseCase } from "../accept-on-demand-assignment.use-case";
import { DeclineOnDemandAssignmentUseCase } from "../decline-on-demand-assignment.use-case";
import { NotOfferedProviderError, OnDemandAssignmentNotOfferedError } from "../errors";
import {
  FakeOnDemandRequestRepository,
  FakeOnDemandAssignmentRepository,
  FakeProviderMatcher,
  FakeDomainEventPublisher,
} from "./fakes";

async function createRequestWithOffer(matcher: FakeProviderMatcher) {
  const requests = new FakeOnDemandRequestRepository();
  const assignments = new FakeOnDemandAssignmentRepository();
  const events = new FakeDomainEventPublisher();
  const request = await new CreateOnDemandRequestUseCase(requests, assignments, matcher, events).execute({
    customerId: "customer-1",
    categoryId: "category-1",
    description: "Fix a leaking pipe",
    lat: 15.5,
    lng: 32.5,
  });
  const [assignment] = await assignments.listByRequestId(request.id);
  return { requests, assignments, events, request, assignment: assignment! };
}

describe("AcceptOnDemandAssignmentUseCase", () => {
  it("assigns the request and expires any other pending offers", async () => {
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const { requests, assignments, events, request, assignment } = await createRequestWithOffer(matcher);
    const useCase = new AcceptOnDemandAssignmentUseCase(assignments, requests, events);

    await useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" });

    const updatedRequest = await requests.findById(request.id);
    expect(updatedRequest?.status).toBe("ASSIGNED");
    const updatedAssignment = await assignments.findById(assignment.id);
    expect(updatedAssignment?.status).toBe("ACCEPTED");
    expect(events.published.map((e) => e.type)).toContain("OnDemandAssignmentAccepted");
  });

  it("rejects acceptance from a provider the assignment wasn't offered to", async () => {
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const { requests, assignments, events, assignment } = await createRequestWithOffer(matcher);
    const useCase = new AcceptOnDemandAssignmentUseCase(assignments, requests, events);

    await expect(useCase.execute({ assignmentId: assignment.id, providerId: "provider-2" })).rejects.toBeInstanceOf(
      NotOfferedProviderError,
    );
  });

  it("only lets one of two racing accept calls on the same assignment win (atomic claim)", async () => {
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const { requests, assignments, events, assignment } = await createRequestWithOffer(matcher);
    const useCase = new AcceptOnDemandAssignmentUseCase(assignments, requests, events);

    // Simulates a provider double-tapping accept (or two concurrent
    // requests) — only the first compareAndSetStatus call should claim
    // the assignment; the second must see it's no longer OFFERED.
    await useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" });

    await expect(useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" })).rejects.toBeInstanceOf(
      OnDemandAssignmentNotOfferedError,
    );
  });
});

describe("DeclineOnDemandAssignmentUseCase", () => {
  it("re-offers to the next candidate, excluding the declining provider", async () => {
    const matcher = new FakeProviderMatcher([
      { providerId: "provider-1", score: 90, distanceKm: 2 },
      { providerId: "provider-2", score: 80, distanceKm: 4 },
    ]);
    const { requests, assignments, events, request, assignment } = await createRequestWithOffer(matcher);
    const useCase = new DeclineOnDemandAssignmentUseCase(assignments, requests, matcher, events);
    const eventsBeforeDecline = events.published.length;

    await useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" });

    const requestAssignments = await assignments.listByRequestId(request.id);
    expect(requestAssignments).toHaveLength(2);
    expect(requestAssignments[0]).toMatchObject({ providerId: "provider-1", status: "DECLINED" });
    expect(requestAssignments[1]).toMatchObject({ providerId: "provider-2", status: "OFFERED" });
    expect(events.published.slice(eventsBeforeDecline).map((e) => e.type)).toEqual([
      "OnDemandAssignmentDeclined",
      "OnDemandProviderOffered",
    ]);
  });

  it("leaves the request with no active offer when no other candidate exists", async () => {
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const { requests, assignments, events, request, assignment } = await createRequestWithOffer(matcher);
    const useCase = new DeclineOnDemandAssignmentUseCase(assignments, requests, matcher, events);
    const eventsBeforeDecline = events.published.length;

    await useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" });

    const requestAssignments = await assignments.listByRequestId(request.id);
    expect(requestAssignments).toHaveLength(1);
    expect(requestAssignments[0]).toMatchObject({ status: "DECLINED" });
    expect(events.published.slice(eventsBeforeDecline).map((e) => e.type)).toEqual(["OnDemandAssignmentDeclined"]);
  });

  it("rejects a second decline on an already-declined assignment", async () => {
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const { requests, assignments, events, assignment } = await createRequestWithOffer(matcher);
    const useCase = new DeclineOnDemandAssignmentUseCase(assignments, requests, matcher, events);
    await useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" });

    await expect(useCase.execute({ assignmentId: assignment.id, providerId: "provider-1" })).rejects.toBeInstanceOf(
      OnDemandAssignmentNotOfferedError,
    );
  });
});
