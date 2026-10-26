import { NewControls } from "../new-controls.client";

export const metadata = { title: "Flood new controls · integration" };

// Keep the route server-rendered; interactive controls cross their own client boundary.
export default function NewControlsPage() {
  return <NewControls />;
}
