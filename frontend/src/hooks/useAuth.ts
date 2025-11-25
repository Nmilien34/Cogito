import { useEffect, useState } from "react";
import { api, setAuthToken } from "../api/client";

export const useAuth = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("csr_token");
    if (token) {
      setReady(true);
      return;
    }

    const email = import.meta.env.VITE_DEMO_EMAIL || "ruth@cogito.local";
    const password = import.meta.env.VITE_DEMO_PASSWORD || "RuthPassword!123";

    api
      .post<{ token: string }>("/auth/login", { email, password })
      .then((data) => {
        setAuthToken(data.token);
        setReady(true);
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
  }, []);

  return ready;
};

