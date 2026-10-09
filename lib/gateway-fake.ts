import type { Decision, DecisionCreateParams, OpenAIGateway } from "./gateway";

export type FakeGatewayOptions = {
  draftRubric?: (jdText: string) => unknown | Promise<unknown>;
  decide?: (request: DecisionCreateParams) => Decision | Promise<Decision>;
};

/** In-memory gateway for tests and mock mode. Records every call. */
export function createFakeGateway(options: FakeGatewayOptions = {}) {
  const calls = { draftRubric: [] as string[], decide: [] as DecisionCreateParams[] };
  const gateway: OpenAIGateway & { calls: typeof calls } = {
    calls,
    async draftRubric(jdText) {
      calls.draftRubric.push(jdText);
      if (!options.draftRubric) throw new Error("Fake gateway: draftRubric not configured");
      return options.draftRubric(jdText);
    },
    async decide(request) {
      calls.decide.push(request);
      if (!options.decide) throw new Error("Fake gateway: decide not configured");
      return options.decide(request);
    },
  };
  return gateway;
}
