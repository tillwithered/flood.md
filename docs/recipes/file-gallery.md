# File gallery

Use FileCardGrid when thumbnails help people recognize files. Use the same
thumbnail placement, ratio and density across cards. Descriptions can vary.
Set `preserveColumns` if cards should keep their width as files move between
views. The number of columns still responds to the available width.
Pair a smaller `minItemWidth` with `maxColumns` when a tablet can show two
comfortable cards and a wide gallery should stop at three. Check the card
width just before the next column fits.

- Put each file's checkbox, filename link, preview and download on its own
  card. Opening the preview leaves selection unchanged. Closing it returns
  focus to its trigger.
- Keep selection by stable file ID. Use BulkActionBar with
  `placement="viewport"` for commands on selected files. Clear selection on
  a view change so an action applies only to files in the current view.
  Allow clearance below the last card in the workspace layout.
- Move files to Archived or back to Active. When the bar disappears after an
  action, return focus to a stable element in the gallery and announce the
  accepted result. The example keeps file state in memory.

[Try the file gallery](/playground/content#file-gallery)

<!-- flood:file-gallery -->
