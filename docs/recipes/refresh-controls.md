# Refresh a live collection

Place manual refresh and cadence in one SplitButton. Keep the last accepted rows in the table during refresh. Use a separate initial loading state if there are no accepted rows yet.

The host owns scheduling, visibility, cancellation, and which response can replace the current query. A cadence change updates the schedule. It requests new data only if that is a deliberate product behavior. Coalesce timer and manual requests for the same query, and discard late results after the query changes.

Use DataFreshness when the age of the retained rows matters. Keep the time of the last accepted snapshot visible while a refresh is running or after a failed attempt. Change the timestamp when newer rows are accepted. Keep detailed recovery guidance beside the refresh action if users need it.

<!-- flood:refresh-controls -->

Check a manual refresh, keyboard cadence selection, and a slow request while the active filter changes. Keep the interval menu usable during refresh. If it fails, preserve the accepted rows and the filter selection, surface the failure through feedback the user can act on, and keep the refresh action available.
