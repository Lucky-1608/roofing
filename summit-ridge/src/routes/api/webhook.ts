import { createFileRoute } from "@tanstack/react-router";
import { handleWebhook } from "../../server/handlers";

export const Route = createFileRoute("/api/webhook")({
  server: { handlers: { POST: ({ request }: { request: Request }) => handleWebhook(request) } },
});
