import { createFakeGateway, type FakeGatewayOptions } from "@/lib/gateway-fake";
import { createRoleService } from "@/lib/role-service";
import { createStore } from "@/lib/store";

export async function makeService(dataDir: string, gatewayOptions: FakeGatewayOptions = {}) {
  const store = createStore(dataDir);
  const gateway = createFakeGateway(gatewayOptions);
  let tick = 0;
  // Deterministic, strictly increasing clock so ordering assertions are stable.
  const now = () => new Date(Date.UTC(2026, 9, 9, 12, 0, tick++));
  const service = createRoleService({ store, gateway, now });
  return { service, store, gateway, dataDir };
}
