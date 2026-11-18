import { Heading, Link } from "@flood-md/react";
import { SiteSearch } from "./site-search";

export function Home() {
  return <main id="main-content" tabIndex={-1} className="home-main">
    <section className="home-discovery" aria-labelledby="hero-title">
      <Heading level={1} size="large" id="hero-title">
        Good interfaces start with a little Flood.
      </Heading>
      <div className="home-search"><SiteSearch placement="home" /></div>
      <Link href="/docs/installation" variant="ghost" size="sm" className="home-install-link">Install Flood</Link>
    </section>
  </main>;
}
