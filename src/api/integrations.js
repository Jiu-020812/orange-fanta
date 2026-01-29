import client from "./client";
import { request } from "./request";

export async function listIntegrations() {
  const res = await request(() => client.get("/api/integrations"));
  return res.data;
}

export async function upsertIntegration(payload) {
  const res = await request(() => client.post("/api/integrations", payload));
  return res.data;
}

export async function removeIntegration(provider) {
  const res = await request(() =>
    client.delete(`/api/integrations/${provider}`)
  );
  return res.data;
}
