import { computeAckTimeMs, computeSnoozedTime } from "../reminderAck";

describe("reminder acknowledgement helpers", () => {
  it("computes acknowledgement latency in ms", () => {
    const triggeredAt = "2025-11-21T10:00:00.000Z";
    const acknowledgedAt = "2025-11-21T10:00:15.500Z";
    expect(computeAckTimeMs(triggeredAt, acknowledgedAt)).toBe(15500);
  });

  it("computes snoozed time", () => {
    const triggeredAt = "2025-11-21T10:00:00.000Z";
    const snoozed = computeSnoozedTime(triggeredAt, 10);
    expect(snoozed.toISOString()).toBe("2025-11-21T10:10:00.000Z");
  });
});

