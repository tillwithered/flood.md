# Dependent filters

Use a dependent filter when one choice determines which values are valid for another. For deployments, choosing a region limits the sites. Keep search and other independent constraints when changing the region or clearing these filters.

Keep Region and Site in the same Filters panel. Disable Site while no region is selected and explain why beside the field. A region with no sites has its own empty message. If changing the parent makes the selected site incompatible, clear only that site in the draft. Apply both values in one update. Cancel and Escape abandon the draft. Removing the accepted region also removes its site, while removing the site leaves the region selected.

<!-- flood:dependent-filters -->

The host supplies stable region and site IDs and current options. For remote options, use onLoadSites and update the matching region with loading, ready, or error. Keep accepted filters stable during option loading. Associate each response with the requested region and ignore stale responses. Validate saved queries against the same relationships before restoring them, and surface any unavailable values.

Verify changing the parent after choosing a site, restoring a compatible site, clearing the parent chip, and closing the panel without applying. If the accepted filters change externally, close the obsolete draft. Check keyboard focus return and verify that search survives a filter reset.
