# Flood application continuity evaluation

Give each clean agent the same installed Flood versions, records, starter
project, model and reasoning effort. The candidate changes the installed
agent guidance. Ask the agent to report which guide paths it read. Keep this
rubric outside the project the agent receives.

> Build Field Notes, a desktop editorial app for a small team, on Flood.
> Include an article library, an article editor and team settings. Review
> comments while editing, keep a draft when leaving and returning, and let an
> editor send an article to review with confirmation. Make the core flows
> usable at desktop and narrow widths. Use the supplied data. This is a
> local prototype.

Compare the unedited outputs with the same article and window sizes
(1280 × 900 and 390 × 844). Record the guide paths, screenshots and
browser interaction results. Score each criterion on its own.

- Library and settings remain real destinations. The shell is recognizable.
  Equivalent page headers and the beginning of their owned content share a
  visual role and alignment.
- The editor stays a usable working region. Comments retain the selected
  article, remain reachable while editing, and use a surface suitable for
  each tested width. At most one comments surface is active at a time.
- Compare the comments surface and the review confirmation with the rest of
  the app. Check literal title/body alignment, title and label roles, group
  rhythm and the placement and priority of actions. A long comment or narrow
  width must leave the close and commit actions reachable.
- Typing, leaving for another section and returning preserves the draft.
  Cancelling review leaves the article in Draft. Confirming changes the
  correct article to In review. Check focus after dismissing each surface.

Score the visual criteria from inspected captures and the interaction
criteria from executed steps. One matched pair is evidence about one task,
not a reliable score across applications.

## Follow-up when comments remain inline

Give a fresh agent a frozen copy of the completed prototype and its installed
Flood package. Evaluate this adaptation against the criteria below.

> Make Review comments a dismissible side panel while editing at desktop widths
> and a bottom sheet at narrow widths. Keep the article and editing context if
> the window changes width while comments are open. Leave the existing review
> confirmation in place. Use the installed Flood design system and make comments
> feel like part of this app.

Type into the article, open comments, resize to the narrow width and back
with comments still open, then dismiss them. Verify one active modal, same
comment and article, unchanged draft and return focus. Capture both surfaces
and compare the title, content edge, close control and hierarchy against the
existing confirmation. Keep results of this follow-up distinct from the pair.
