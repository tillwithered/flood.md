# Map and list

Use Split and a manual-selection ListBox for a list of locations beside an optional map. Both surfaces render the same accepted location IDs and use one selection. Arrow keys browse addresses. Enter or Space selects the location. A map adapter projects coordinates, renders markers, and handles packing, camera motion and provider details.

<!-- flood:map-and-list -->

Wire marker activation to the same selection callback as the list and preserve focus on the initiating surface. A renderer can pan to a selection from the list while treating map-origin changes separately. Hover can preview a marker, while activation selects it. Clear selection without resetting the search or camera. Give Clear a stable slot so showing it leaves the results in place. Revalidate the accepted selection when filters change. If the product searches within the viewport, use an explicit search-area action and update the accepted result set together.

Use stable feature IDs to connect map features to rows. Tile queries can return duplicate features, so deduplicate results before building the shared set. The map's absence or failure should leave the list usable. Test list keyboard selection, marker selection, clear, filtering out the selection and narrow reflow with the intended renderer. [Mapbox GL JS viewport filtering](https://docs.mapbox.com/mapbox-gl-js/example/filter-features-within-map-view/)
