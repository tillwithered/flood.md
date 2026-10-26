import { prerenderToNodeStream } from "react-dom/static";
import { App } from "./app";
import Documentation from "./documentation";

/** Static rendering waits for all content without streaming hidden fallbacks. */
export async function render(path: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(<App path={path} documentation={Documentation} />, {
    signal: AbortSignal.timeout(30_000),
    onError(error) { throw error; },
  });
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
