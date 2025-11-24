describe("Cogito Smart Radio", () => {
  it("creates reminder via voice command flow", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        class FakeSpeechRecognition {
          public lang = "en-US";
          public interimResults = true;
          public continuous = false;
          public onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
          public onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
          start() {
            setTimeout(() => {
              this.onresult?.({
                results: [
                  [
                    {
                      transcript: "Add a reminder to take Donepezil at 2 PM",
                    },
                  ],
                ],
              } as unknown as SpeechRecognitionEvent);
            }, 0);
          }
          stop() {
            this.onerror?.({} as SpeechRecognitionErrorEvent);
          }
          abort() {}
        }

        (win as any).SpeechRecognition = FakeSpeechRecognition;
        (win as any).webkitSpeechRecognition = FakeSpeechRecognition;

        const handlers: Record<string, (payload: any) => void> = {};
        (win as any).__socketHandlers = handlers;
        (win as any).io = () => ({
          on: (event: string, cb: (payload: any) => void) => {
            handlers[event] = cb;
          },
          disconnect: () => {},
        });
      },
    });

    cy.findByRole("button", { name: /start listening/i }).click();
    cy.findByText(/Parsed/i).should("exist");
    cy.findByRole("button", { name: /create reminder/i }).click();
    cy.findByText(/Reminder created/i).should("exist");
  });

  it("ducks audio when reminder trigger simulated", () => {
    cy.window().then((win) => {
      const handler = (win as any).__socketHandlers?.["reminder_trigger"];
      expect(handler).to.be.a("function");
      handler({
        triggeredAt: new Date().toISOString(),
        reminder: {
          id: "rem-1",
          label: "Test Reminder",
          scheduledAt: new Date().toISOString(),
          snoozeMinutes: 5,
          active: true,
        },
      });
    });
    cy.findByRole("button", { name: /confirm/i }).should("exist");
  });
});

