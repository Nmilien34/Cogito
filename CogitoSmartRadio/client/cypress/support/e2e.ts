/// <reference types="cypress" />
import "@testing-library/cypress/add-commands";

beforeEach(() => {
  cy.intercept("GET", `${Cypress.env("apiUrl")}/reminders*`, { fixture: "reminders.json" }).as("loadReminders");
  cy.intercept("GET", `${Cypress.env("apiUrl")}/playlists/*`, { fixture: "playlist.json" }).as("loadPlaylist");
});

