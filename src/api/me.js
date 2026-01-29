import api from "./client";
import { request } from "./request";

export async function getMe() {
  const res = await request(() => api.get("/api/me"));
  return res.data;
}

export async function updateName(name) {
  const res = await request(() => api.patch("/api/me", { name }));
  return res.data;
}

export async function updatePassword({ currentPassword, newPassword }) {
  const res = await request(() =>
    api.patch("/api/me/password", { currentPassword, newPassword })
  );
  return res.data;
}

export async function deleteAccount(password) {
  const res = await request(() =>
    api.delete("/api/me", {
      data: { password },
    })
  );
  return res.data;
}
