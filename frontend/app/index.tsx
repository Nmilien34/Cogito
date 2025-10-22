import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const { user, meta } = useAuth();

  // If user is not logged in, redirect to auth
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // If user needs to complete onboarding, redirect there
  if (
    meta &&
    (meta.needsPhoneVerification ||
      meta.needsNames ||
      meta.needsTermsAcceptance)
  ) {
    return <Redirect href="/onboard" />;
  }

  // User is authenticated and onboarded, redirect to tabs
  return <Redirect href="/(tabs)" />;
}
