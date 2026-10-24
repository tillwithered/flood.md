import { FoundationForm } from "./sample";

export const metadata = { title: "Flood dark foundations · preview" };

// Server-to-client boundary is exercised by the production Next build.
export default function FoundationsPage() {
  return <FoundationForm />;
}
