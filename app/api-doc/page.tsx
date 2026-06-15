import { getApiDocs } from "@/lib/swagger";
import SwaggerClient from "./SwaggerClient";

export default async function ApiDocPage() {
  const spec = await getApiDocs();
  return (
    <section className="container mx-auto p-4">
      <SwaggerClient spec={spec as Record<string, unknown>} />
    </section>
  );
}