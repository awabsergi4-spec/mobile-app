import { describe, it, expect } from "vitest";
import { UpdateOnDemandStatusUseCase } from "../update-on-demand-status.use-case";
import { CancelOnDemandRequestUseCase } from "../cancel-on-demand-request.use-case";
import { RecordTrackingPingUseCase } from "../record-tracking-ping.use-case";
import { InvalidOnDemandStatusTransitionError } from "../errors";
import { FakeOnDemandRequestRepository, FakeOnDemandTrackingRepository, FakeDomainEventPublisher } from "./fakes";

async function seedAssignedRequest(requests: FakeOnDemandRequestRepository) {
  const request = await requests.create({
    customerId: "customer-1",
    categoryId: "category-1",
    description: "Fix a leaking pipe",
    lat: 15.5,
    lng: 32.5,
  });
  await requests.updateStatus(request.id, "ASSIGNED");
  return request;
}

describe("UpdateOnDemandStatusUseCase", () => {
  it("walks ASSIGNED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const events = new FakeDomainEventPublisher();
    const request = await seedAssignedRequest(requests);
    const useCase = new UpdateOnDemandStatusUseCase(requests, events);

    await useCase.execute({ requestId: request.id, toStatus: "EN_ROUTE" });
    await useCase.execute({ requestId: request.id, toStatus: "IN_PROGRESS" });
    const completed = await useCase.execute({ requestId: request.id, toStatus: "COMPLETED" });

    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
  });

  it("rejects skipping a step (ASSIGNED straight to COMPLETED)", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const events = new FakeDomainEventPublisher();
    const request = await seedAssignedRequest(requests);
    const useCase = new UpdateOnDemandStatusUseCase(requests, events);

    await expect(useCase.execute({ requestId: request.id, toStatus: "COMPLETED" })).rejects.toBeInstanceOf(
      InvalidOnDemandStatusTransitionError,
    );
  });
});

describe("CancelOnDemandRequestUseCase", () => {
  it("cancels a SEARCHING request", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const events = new FakeDomainEventPublisher();
    const request = await requests.create({
      customerId: "customer-1",
      categoryId: "category-1",
      description: "Fix a leaking pipe",
      lat: 15.5,
      lng: 32.5,
    });
    const useCase = new CancelOnDemandRequestUseCase(requests, events);

    await useCase.execute({ requestId: request.id, cancelledByUserId: "customer-1" });

    const updated = await requests.findById(request.id);
    expect(updated?.status).toBe("CANCELLED");
    expect(updated?.cancelledAt).not.toBeNull();
  });

  it("refuses to cancel once IN_PROGRESS", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const events = new FakeDomainEventPublisher();
    const request = await seedAssignedRequest(requests);
    await requests.updateStatus(request.id, "EN_ROUTE");
    await requests.updateStatus(request.id, "IN_PROGRESS");
    const useCase = new CancelOnDemandRequestUseCase(requests, events);

    await expect(
      useCase.execute({ requestId: request.id, cancelledByUserId: "customer-1" }),
    ).rejects.toBeInstanceOf(InvalidOnDemandStatusTransitionError);
  });
});

describe("RecordTrackingPingUseCase", () => {
  it("records a ping while EN_ROUTE", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const tracking = new FakeOnDemandTrackingRepository();
    const request = await seedAssignedRequest(requests);
    await requests.updateStatus(request.id, "EN_ROUTE");
    const useCase = new RecordTrackingPingUseCase(requests, tracking);

    await useCase.execute({ requestId: request.id, lat: 15.51, lng: 32.51 });

    expect(await tracking.listByRequestId(request.id)).toHaveLength(1);
  });

  it("rejects a ping while still SEARCHING", async () => {
    const requests = new FakeOnDemandRequestRepository();
    const tracking = new FakeOnDemandTrackingRepository();
    const request = await requests.create({
      customerId: "customer-1",
      categoryId: "category-1",
      description: "Fix a leaking pipe",
      lat: 15.5,
      lng: 32.5,
    });
    const useCase = new RecordTrackingPingUseCase(requests, tracking);

    await expect(useCase.execute({ requestId: request.id, lat: 15.51, lng: 32.51 })).rejects.toBeInstanceOf(
      InvalidOnDemandStatusTransitionError,
    );
  });
});
