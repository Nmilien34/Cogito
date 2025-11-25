import { parseVoiceCommand } from "../voiceParser";

describe("parseVoiceCommand", () => {
  it("parses time and label from natural language", () => {
    const result = parseVoiceCommand("Add a reminder to take Donepezil at 9 AM every day");
    expect(result).not.toBeNull();
    expect(result?.label).toContain("Donepezil");
    expect(result?.recurrence).toBe("DAILY");
  });

  it("returns null when time missing", () => {
    expect(parseVoiceCommand("Just say hello")).toBeNull();
  });
});

