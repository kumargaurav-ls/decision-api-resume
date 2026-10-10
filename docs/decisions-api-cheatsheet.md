# Decisions API cheatsheet

OpenAI's Decisions API (public beta since 6 Oct 2026) answers typed questions with probabilities instead of generating text. Verified against `openai` npm 7.30 (`src/resources/decisions.ts`).

## Call it

```ts
import OpenAI from "openai";

const client = new OpenAI(); // reads OPENAI_API_KEY

const decision = await client.decisions.create({
  model: "gpt-6-luna", // the only model in the beta
  input: "RESUME:\n...", // string, or [{ role: "user", content: string | parts[] }]
  questions: [
    { type: "predicate", name: "must.python_7y", instructions: "The candidate has 7+ years of Python." },
    {
      type: "choice",
      name: "fit",
      instructions: "How well does the candidate fit?",
      choices: [
        { value: "strong_fit", description: "Meets every must-have" },
        { value: "possible_fit", description: "Misses one must-have" },
        { value: "weak_fit", description: "Misses several" },
      ],
    },
    {
      type: "score",
      name: "dim.python_depth",
      instructions: "Python depth",
      levels: [{ label: "None" }, { label: "Basic" }, { label: "Working" }, { label: "Strong" }, { label: "Expert" }],
    },
  ],
});
```

curl: `POST https://api.openai.com/v1/decisions` with `Authorization: Bearer $OPENAI_API_KEY` and the same JSON body.

## Read the answers

Answers come back in question order; match them by `name` to be safe.

| Type | Fields |
|---|---|
| `predicate` | `probability` (0 to 1) |
| `choice` | `choice`, `confidence`, `probabilities: [{ value, probability }]` |
| `score` | `score` (Σ p × level index, can be fractional), `confidence`, `probabilities: [{ label, value, probability }]` |
| `refusal` | `name` only. Any single question can refuse; the rest still answer |

`usage`: `input_tokens`, `output_tokens` (0), `total_tokens`, plus cached / cache-write / reasoning token details.

## Know the limits

- Input is text or inline base64 images (up to 128). No PDFs, file IDs or URLs: extract text first.
- Choice values are typed: the string `"true"` and the boolean `true` are different values.
- No published limits on questions or levels per request; context is about 272K tokens.
- $0.10 per million input tokens; output is free. A 3K-token resume costs about $0.0003.
- Confidence is not accuracy. Measure on labelled examples, set thresholds, keep a human in the loop.
- A decision is not an authorization boundary. Keep permissions in your own code.
