# Navigation workspace

[Open the working workspace](/playground/navigation).

The workspace compares a standalone Sidebar with a GlobalRail + ContextBar
composition. Both use the same Sidebar and NavigationTree owners. GlobalRail and
ContextBar describe their responsibilities here; they are not additional package
exports. The example's project, inbox and file records live in memory.
Use the account menu in the footer to switch between Flood Studio and Flood Labs.
The navigation header shares the height of the workspace toolbar. The expanded
Sidebar puts the service mark at the start and the collapse control at the end.
On the compact rail, the toggle replaces the mark on hover or keyboard focus.
On touch, the toggle stays visible.
Labs adds nested project collections for testing long labels and scrolling.
The host remembers the last route and expanded branches per workspace during
the session. It validates a remembered route against the target workspace and
falls back to the project overview if that destination is unavailable.
The **Go to page** action uses CommandPalette. It searches the
current workspace and expands the selected destination's parent branches.
On navigation, the host moves focus to the destination heading.

## Choose the hierarchy

If the sidebar has one group whose title repeats the app or workspace context,
use `hideLabel` and keep the group's accessible name. When showing a group title,
align it with the labels of its destinations.

Use one Sidebar when the application has a small destination hierarchy. Separate
global and contextual navigation when switching domains changes the available
destinations. The global rail stays flat and stable; its active module is a
location, while the contextual destination is a page. An open ContextBar replaces
the need for a second copy of its destinations in a global flyout.

On narrow hosts, limit the expanded pane to a share of available width and keep
the working heading and primary controls reachable. The playground condenses
the toolbar and keeps wide table content in the table's own scroll area.

Keep module, route, expansion and context visibility independent. Anchor the
visibility control in the persistent rail header. When the context is hidden,
hover a rail module to preview its contextual links in a flyout that fills the
available rail height with top and bottom insets, even for short lists.
The preview preserves focus and stays open while the pointer crosses into the
panel. Click or use the keyboard to open it for interaction. Escape returns
focus to the module when it owned focus. Choosing a destination closes the flyout and keeps the
context docked or hidden as the user last set it. Browser Back restores the route.
Use real links and host routing. A modified click must remain a browser action
rather than changing the current tab's module through an unconditional handler.

## Compose the panes

| Region or behavior | Flood owner |
| --- | --- |
| Workspace landmarks, skip target and scroll boundary | AppShell, SkipLink and ScrollArea |
| Shared identity, breadcrumbs and global commands | AppTopBar, Breadcrumb, Button and CommandPalette |
| Current page title and page actions | PageHeader |
| Docked rail and grouped destinations | Sidebar, NavigationGroup and NavigationTree |
| Temporary navigation on a narrow host | Drawer with the same destination definitions |
| Account commands and identity | Menu, Avatar and Button |

Use AppShell's default content scrolling for a bounded workspace. Give an
embedded shell an explicit block size. Choose `scroll="page"` for natural
document scrolling. Place a persistent top bar and footer in the shell slots,
and PageHeader inside main. The shell has a skip target and owns the scroll
boundary; the host owns routes and persisted choices.

For a single Sidebar, opt into `navigationDrawer` with a width threshold in CSS
pixels and a `renderContent(close)` function. AppShell observes its own width.
The playground uses 480 px for the classic Sidebar profile. Pass a `topBar`
render function to place the named trigger with the existing toolbar controls.
The Rail + Context example keeps its separate pane visibility and hover flyout.

Share accepted route and branch state between Sidebar and Drawer. Close the
Drawer on an accepted destination and focus the destination heading. Escape
or explicit dismissal restores focus to the trigger. When a resize removes
the focused dock or Drawer, AppShell transfers focus to the new trigger or
the work region, respectively.

This host-owned layout uses Flood components. In the 0.2.11 source candidate,
NavigationItem owns the shared row, NavigationGroup owns related items and their
optional heading, and NavigationTree composes rows into a destination hierarchy.
Sidebar places these owners between its fixed header and footer. The caller
supplies icons, identity controls and accepted route state; keep layout CSS in the
host and import the matching Flood stylesheet once. These candidate APIs require
matching installed declarations and are not added to an older npm release by
reading this recipe.

```tsx
"use client";
import type { ReactNode } from "react";
import { AppShell, AppTopBar, FloodRoot, Sidebar, type SidebarProps } from "@flood-md/react";
import "@flood-md/react/styles.css";

type Props = {
  global: SidebarProps;
  context: SidebarProps;
  contextVisible: boolean;
  header: ReactNode;
  children: ReactNode;
};

export function NavigationWorkspace({
  global, context, contextVisible, header, children,
}: Props) {
  return (
    <FloodRoot>
      <AppShell
        navigation={<>
          <Sidebar {...global} collapsed collapsible={false} currentKind="location" />
          {contextVisible && <Sidebar {...context} currentKind="page" />}
        </>}
        topBar={<AppTopBar start={header} />}
        scrollOrientation="vertical"
      >
        {children}
      </AppShell>
    </FloodRoot>
  );
}
```

A bounded parent can supply the height instead of `100dvh`. Reserve remaining
height with flex/grid rather than subtracting an assumed toolbar height: labels
and tooling can wrap at enlarged text. Sidebar owns the middle navigation scroll
viewport; AppShell owns the main content viewport. Table overflow remains inside
the table's owner. Header and footer do not scroll with their navigation lists.

## Compose the row before the shell

Use NavigationItem for a destination, command or disclosure rather than a local
button-shaped row. A destination has an href and keeps native Link behavior. A
command has onAction and uses Button. A branch without a destination uses one
full-row disclosure target; a destination with children keeps the link and the
disclosure as separate sibling controls inside one coherent row surface. Clicking
the link must not also change the branch's expansion. A disclosure must not be
nested inside the link.

Current destination, ancestor of the current destination, accepted expansion and
keyboard focus are distinct states. The row owns its visual surface across the
label and disclosure; do not paint a shorter selected pill only behind the link
or add the trailing inset twice. Leading art, label and real trailing anatomy
share deliberate tracks. A supporting chevron can use a smaller IconButton
iconSize while retaining the normal control target.

NavigationTree remains the recursive owner: it composes NavigationItem, manages
the accepted expandedValues set and presents compact branches through Popover.
The popup can include a branch's own destination and its children. A standalone
compact NavigationItem does not create a hidden child hierarchy on its own.

## Configure groups and fixed regions

NavigationGroup can omit its label, hide a supplied visual label, add a meaningful
headingAction, show a separator or expose its own disclosure. Its expanded state
is independent of NavigationTree branch expansion and Sidebar width. A collapsible
group needs a nonempty label; hideLabel keeps the toggle's accessible name even
when the visual title is omitted. collapseDisabled affects that group disclosure,
not arbitrary child links or actions.

In compact presentation, group contents stay reachable and the group toggle is
hidden. This presentation does not overwrite the accepted expanded state: returning
to expanded navigation restores the group's prior choice. A supplied heading
action remains available on the compact axis rather than disappearing with text.

SidebarGroup exposes the group label, hideLabel, headingAction, separator and
collapsible/expanded configuration when Sidebar assembles the hierarchy. Start
these optional additions empty. Use a section title only when it distinguishes
related destinations; a title already provided by the pane need not be repeated.
Use branchGuides within a group when several levels of nesting need a visible
guide. Use trailingAction for an independent action alongside row metadata.
headerSeparator and footerSeparator are independent, opt-in Sidebar choices,
not mandatory lines around every fixed region.

Header and footer content must follow the same mode contract as the body. In
expanded navigation, identity and utility rows use the agreed icon/text tracks.
In compact navigation, measure the actual brand, toggle, destination and account
hit-area centers against the full rail center. A centered footer wrapper is not
proof that its Menu trigger or Avatar is centered. Adapt the identity content
deliberately while preserving its accessible name and useful recognition cue.

## Presentation and content

Sidebar's quiet recipe uses restrained inactive text and rectangular current
rows; standard retains stronger pill geometry. Compare these against the main
work area, not only in isolation. Preserve explicit icon sizes, shared inline
tracks and a common top anchor across adjacent panes. Omitting a collapse button
must not shorten one header and lift its entire navigation above the other.

Use `SidebarGroup.hideLabel` when the pane header already names the only group.
Its navigation landmark keeps its label. Add badges only for meaningful counts or
states, not to fill every destination. Account utilities and workspace settings
belong in deliberate fixed slots rather than a second contextual destination list.

## State and focus ownership

Keep search and filters in their applicable module. An inactive Projects filter
must not create a Clear filters action in Inbox, and clearing Inbox search must
not modify the accepted Projects query. Validate the entire route, including
extra or missing path segments, before deriving a title or current destination.

Preserve surviving focus. When a focused record, action or pane disappears and
focus falls to the document body, the host restores it to an intentional stable
destination, such as the main heading. Do not refocus the heading on every data
render or steal focus from another surviving control. A visibility toggle can
keep focus on itself before removing its pane. A dialog whose original trigger
disappeared needs the same explicit fallback when it closes.

## Verify the workspace

Check both layouts, module/page current semantics, hidden context through module
changes and Back, modified links, branch disclosure and independent scrolling.
Exercise both a full-row branch toggle and a destination-plus-disclosure row;
include a host refusing an expansion request. Configure group headings, actions,
separators and collapse independently, then switch compact mode without losing
the accepted group choice or destinations. Compare actual header/footer trigger
centers with body controls, including the account trigger, rather than inspecting
the middle list alone. Check current/hover/focus surfaces across the complete row.
Compare visible glyphs as well as their slots. If the same glyph reads off-axis
across several states, review its artwork before moving the shared hit area.
Exercise a filter in one module followed by search in another; remove the focused
row; close a dialog after its original row disappears. Review normal desktop,
short desktop windows, 1280 px with a 24 px root, RTL and forced colors. Visual
review and executed checks are separate evidence; the guidance itself is not a
pass certificate.
