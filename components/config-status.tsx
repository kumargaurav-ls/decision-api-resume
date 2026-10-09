import { loadApp } from "@/lib/app";
import { SetupRequired } from "./setup-required";

/**
 * Sits beside page content in its own Suspense boundary so page shells still prerender.
 * Shows the setup panel when env is incomplete, or the mock-mode banner.
 */
export async function ConfigStatus() {
  const loaded = await loadApp();
  if ("problems" in loaded) return <SetupRequired {...loaded.problems} />;
  if (!loaded.app.config.mockMode) return null;
  return (
    <div className="border-b bg-caution-soft px-4 py-2 text-center text-sm text-caution">
      Mock mode. OpenAI responses are canned, not real.
    </div>
  );
}
