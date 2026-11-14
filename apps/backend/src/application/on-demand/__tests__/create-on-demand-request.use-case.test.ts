import { describe, it, expect } from "vitest";
import { CreateOnDemandRequestUseCase } from "../create-on-demand-request.use-case";
import {
  FakeOnDemandRequestRepository,
  FakeOnDemandAssignmentRepository,
  FakeProviderMatcher,
  FakeDomainEventPublisher,
} from "./fakes";

describe("CreateOnDemandRequestUseCase", () => {
  it("offers the top-matched provider immediately for an INSTANT request", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const assignments = new FakeOnDemandAssignmentRepository();
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const events = new FakeDomainEventPublisher();
    const useCase = new CreateOnDemandRequestUseCase(requests, assignments, matcher, events);

    const request = await useCase.execute({
      customerId: "customer-1",
      categoryId: "category-1",
      description: "Fix a leaking pipe",
      lat: 15.5,
      lng: 32.5,
    });

    const requestAssignments = await assignments.listByRequestId(request.id);
    expect(requestAssignments).toHaveLength(1);
    expect(requestAssignments[0]).toMatchObject({ providerId: "provider-1", status: "OFFERED" });
    expect(events.published.map((e) => e.type)).toEqual(["OnDemandRequestCreated", "OnDemandProviderOffered"]);
  });

  it("leaves the request with no offer when no provider matches", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const assignments = new FakeOnDemandAssignmentRepository();
    const matcher = new FakeProviderMatcher([]);
    const events = new FakeDomainEventPublisher();
    const useCase = new CreateOnDemandRequestUseCase(requests, assignments, matcher, events);

    const request = await useCase.execute({
      customerId: "customer-1",
      categoryId: "category-1",
      description: "Fix a leaking pipe",
      lat: 15.5,
      lng: 32.5,
    });

    expect(await assignments.listByRequestId(request.id)).toHaveLength(0);
    expect(events.published.map((e) => e.type)).toEqual(["OnDemandRequestCreated"]);
  });

  it("skips matching entirely for a SCHEDULED request", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const assignments = new FakeOnDemandAssignmentRepository();
    const matcher = new FakeProviderMatcher([{ providerId: "provider-1", score: 90, distanceKm: 2 }]);
    const events = new FakeDomainEventPublisher();
    const useCase = new CreateOnDemandRequestUseCase(requests, assignments, matcher, events);

    const request = await useCase.execute({
      customerId: "customer-1",
      categoryId: "category-1",
      description: "Fix a leaking pipe next week",
      lat: 15.5,
      lng: 32.5,
      fulfillmentMode: "SCHEDULED",
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(await assignments.listByRequestId(request.id)).toHaveLength(0);
    expect(events.published.map((e) => e.type)).toEqual(["OnDemandRequestCreated"]);
  });
});
