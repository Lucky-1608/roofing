import { createFileRoute } from "@tanstack/react-router";
import { handleLead } from "../../server/handlers";

export const Route = createFileRoute("/api/lead")({
  server: { handlers: { POST: ({ request }: { request: Request }) => handleLead(request) } },
});
