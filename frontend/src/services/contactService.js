import api from "./api";

export const sendContactMessage = (payload) =>
  api.post("/contact/", payload).then((r) => r.data);
