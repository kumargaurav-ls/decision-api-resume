import type { Scorecard } from "@/lib/decisions/scorecard";

/** Plain-value scorecard; ticket 07 replaces it with the full visual one. */
export function BasicScorecard({ scorecard }: { scorecard: Scorecard }) {
  const { fit } = scorecard;
  return (
    <div className="space-y-8 text-sm">
      <section>
        <h2 className="font-semibold">Overall fit</h2>
        {fit.kind === "choice" ? (
          <p className="mt-2 font-mono">
            {fit.choice} · confidence {fit.confidence.toFixed(2)}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">{fit.kind === "refusal" ? "Declined" : "No answer"}</p>
        )}
      </section>
      <section>
        <h2 className="font-semibold">Dimensions</h2>
        <ul className="mt-2 space-y-1">
          {scorecard.dimensions.map(({ key, name, answer }) => (
            <li key={key} className="flex justify-between gap-4">
              <span>{name}</span>
              <span className="font-mono">{answer.kind === "score" ? `${answer.score.toFixed(1)} / 4` : answer.kind}</span>
            </li>
          ))}
        </ul>
      </section>
      {(["mustHaves", "redFlags"] as const).map((group) => (
        <section key={group}>
          <h2 className="font-semibold">{group === "mustHaves" ? "Must-haves" : "Red flags"}</h2>
          <ul className="mt-2 space-y-1">
            {scorecard[group].map(({ key, statement, answer }) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{statement}</span>
                <span className="shrink-0 font-mono">{answer.kind === "predicate" ? answer.probability.toFixed(2) : answer.kind}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
