import type { Metadata } from "next";
import Link from "next/link";
import { ConceptStrip } from "@/components/lab/concept-strip";
import { LunaLab } from "@/components/lab/luna-lab";

export const metadata: Metadata = {
  title: "How Luna decides · Decision Playground",
  description: "A visual walkthrough of how the Decisions API turns a resume into probabilities, with a live mini-lab.",
};

export default function HowLunaDecidesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ‹ Roles
      </Link>
      <header className="mt-4 max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">How Luna decides</h1>
        <p className="text-muted-foreground">
          Luna doesn&apos;t write an answer. It puts a probability on every answer a question allows, and the app reads the result off
          those numbers. OpenAI hasn&apos;t published how Luna works inside, so this page shows only what you can observe from the API.
        </p>
      </header>

      <div className="mt-10">
        <ConceptStrip />
      </div>

      <div className="mt-14">
        <LunaLab />
      </div>
    </main>
  );
}
