import { api } from "./client";
import type { Medication } from "../types";

export const fetchMedications = (profileId: string) =>
  api.get<Medication[]>(`/medications?profileId=${profileId}`);

export const createMedication = (input: Partial<Medication> & { profileId: string }) =>
  api.post<Medication>("/medications", input);

export const updateMedication = (medicationId: string, input: Partial<Medication>) =>
  api.put<Medication>(`/medications/${medicationId}`, input);

export const deleteMedication = (medicationId: string) => {
  const authToken = localStorage.getItem("csr_token");
  return fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/medications/${medicationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: "include",
  }).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        throw new Error(text || "Failed to delete");
      });
    }
    return res.json();
  });
};

