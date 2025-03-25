/** Short, collision-resistant ids. `crypto.randomUUID` where available. */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  let id = "";
  for (let i = 0; i < 12; i++) {
    id += Math.floor(Math.random() * 36).toString(36);
  }
  return id;
}
