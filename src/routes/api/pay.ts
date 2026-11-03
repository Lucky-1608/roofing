import { createFileRoute } from "@tanstack/react-router";
import { handlePay } from "../../server/handlers";

export const Route = createFileRoute("/api/pay")({
  server: { handlers: { POST: ({ request }: { request: Request }) => handlePay(request) } },
});
