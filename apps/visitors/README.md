# Optional website visitor counter

This private HTTP service is part of the website infrastructure, not a Flood
package. It uses Node24's built-in SQLite and no npm runtime dependencies.
Set VISITOR_DATA_DIR to a persistent volume directory and VISITOR_TOKEN to a
random server-only secret of at least32 characters. The website receives the
same VISITOR_TOKEN and VISITOR_SERVICE_URL pointing to this service's private
address. Never use a public VITE_ variable for either value.

GET /visitors returns {total,since}; POST /visitors accepts {id:UUIDv4} and returns
the same shape. Both require Bearer authentication. /health needs no token.
Only SHA256 hashes are stored in the visitors table. Inserting a hash and
incrementing the aggregate happen in one SQLite transaction; retries, concurrent
requests and process restarts do not count the same identifier twice.

The frontend keeps the random identifier in localStorage. It registers once per
page session, reusing one promise through React remounts; other page visits reuse
the same identifier. Blocked storage causes a read-only total request. The public
website proxy accepts only bounded same-origin JSON and excludes obvious bot
user agents. This is an approximate browser counter, not fraud-proof analytics.
It stores no addresses, referrers, page paths or identifying browser attributes.

The Docker image starts with filesystem setup for its dedicated volume, drops to
UID/GID1000 before opening SQLite or listening, and binds IPv6 for private hosting
networks. Keep one service instance with its own volume; back up visitors.sqlite
with a SQLite-consistent hosting snapshot. Never mount or reuse a legacy service's
data volume. Removing the counter's volume loses its total and deduplication data.

The normal website stays stateless and independent: unavailable counter requests
time out after3s, the rest of the site continues to work. A footer placeholder
appears instead of a fabricated count. Native website deployment remains unchanged.
For a counter code update, deploy the reviewed commit's apps/visitors/Dockerfile;
the retained volume is not part of the image. The counter has no public domain.
Hosting-specific project/service IDs and operational notes belong in Design Lab.

This website-only change needs no npm version bump or public component API change.
