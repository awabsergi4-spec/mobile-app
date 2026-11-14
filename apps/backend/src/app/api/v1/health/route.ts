import { ok } from "@/presentation/http-response";

export async function GET() {
  return ok({ status: "ok" });
}
