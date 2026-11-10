import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { Button, Field, Fieldset, IconSlot, Inline, Popover, SearchInput, Tag, Text, type CollectionToolbarProps } from './index.js';

/** Query chrome only: the host supplies filter drafts, accepted query and saved views. */
export const CollectionQueryBar = /* @__PURE__ */ forwardRef<HTMLFieldSetElement, CollectionToolbarProps>(function CollectionQueryBar({
  label, searchValue, onSearchValueChange, searchLabel = 'Search', searchPlaceholder = 'Search…', clearSearchLabel = 'Clear search',
  appliedFilters = [], onRemoveFilter, appliedFiltersLabel = 'Applied filters', summaryPrefix, quickFilters,
  filterContent, filtersLabel = 'Filters', filterTitle = filtersLabel, filtersOpen, onFiltersOpenChange,
  filterPanelRef, filterPanelClassName, onClear, canClear = Boolean(searchValue || appliedFilters.length), clearLabel = 'Clear filters',
  controlSize = 'sm', disabled = false, hideLabel = true, className, ...props
}, forwardedRef) {
  const root = useRef<HTMLFieldSetElement>(null);
  useImperativeHandle(forwardedRef, () => root.current!, []);
  const generated = useId(), triggerId = `flood-collection-filters-${generated}`, searchId = `flood-collection-search-${generated}`;
  if (![label, searchLabel, clearSearchLabel, appliedFiltersLabel, filtersLabel, filterTitle, clearLabel].every(text => text.trim()) ||
      new Set(appliedFilters.map(filter => filter.id)).size !== appliedFilters.length || appliedFilters.some(filter => !filter.id.trim() || !filter.label.trim()))
    throw new Error('Flood CollectionToolbar requires named controls and unique applied filter IDs');
  const hasPanel = filterContent !== undefined && filterContent !== null && filterContent !== false;
  const hasSummary = Boolean(quickFilters) || appliedFilters.length > 0;
  function focusPersistent() {
    const document = root.current?.ownerDocument;
    document?.getElementById(hasPanel ? triggerId : searchId)?.focus({ preventScroll: true });
  }
  return <Fieldset {...props} ref={root} legend={label} hideLabel={hideLabel} disabled={disabled}
    className={['flood-collection-toolbar', className].filter(Boolean).join(' ')}>
    <Inline gap="3" align="center" className="flood-collection-toolbar__row">
      <div className="flood-collection-toolbar__search"><Field id={searchId} label={searchLabel} hideLabel>{field => <SearchInput {...field}
        controlSize={controlSize} value={searchValue} placeholder={searchPlaceholder} clearLabel={clearSearchLabel} disabled={disabled}
        onChange={event => { if (!disabled) onSearchValueChange(event.currentTarget.value); }} />}</Field></div>
      {hasSummary && <Inline gap="2" align="center" role="group" aria-label={appliedFiltersLabel} className="flood-collection-toolbar__summaries">
        {quickFilters}
        {summaryPrefix && <Text size="compact" tone="subtle">{summaryPrefix}</Text>}
        {appliedFilters.map(filter => <Tag key={filter.id} size={controlSize === 'xl' ? 'lg' : 'md'} disabled={disabled || filter.disabled}
          removeLabel={filter.removeLabel ?? `Remove ${filter.label}`} onRemove={onRemoveFilter ? () => {
            if (disabled || filter.disabled) return;
            focusPersistent(); onRemoveFilter(filter.id);
          } : undefined}>{filter.label}</Tag>)}
      </Inline>}
      {(onClear || hasPanel) && <Inline gap="2" align="center" className="flood-collection-toolbar__commands">
        {onClear && <Button size={controlSize} variant="outline" className="flood-collection-toolbar__clear" data-visible={canClear}
          disabled={disabled || !canClear} aria-hidden={!canClear || undefined}
          onClick={() => { if (disabled || !canClear) return; focusPersistent(); onClear(); }}>{clearLabel}</Button>}
        {hasPanel && <Popover title={filterTitle} ref={filterPanelRef} className={filterPanelClassName} open={filtersOpen}
          onOpenChange={onFiltersOpenChange} disabled={disabled} align="end"
          trigger={trigger => <Button {...trigger} id={triggerId} variant="outline" size={controlSize}>
            <IconSlot size={controlSize}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10m-7 6h4" /></svg></IconSlot>
            {filtersLabel}
          </Button>}>{filterContent}</Popover>}
      </Inline>}
    </Inline>
  </Fieldset>;
});
