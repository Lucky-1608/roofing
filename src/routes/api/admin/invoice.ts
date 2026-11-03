import { createFileRoute } from "@tanstack/react-router";
import { handleFinalInvoice } from "../../../server/handlers";

export const Route = createFileRoute("/api/admin/invoice")({
  server: { handlers: { POST: ({ request }: { request: Request }) => handleFinalInvoice(request) } },
});
