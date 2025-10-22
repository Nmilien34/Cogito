/**
 * Main entry point - redirect to radio screen
 */

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/radio" />;
}
