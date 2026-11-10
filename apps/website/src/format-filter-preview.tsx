import { useId, useState } from "react";
import { EmptyState, FileItem, FileList, Heading, Inline, Label, Select, Stack } from "@flood-md/react";
import { FileSavedViews } from "./file-saved-views";
import { AppliedFilterControl } from "./recipes/collection-views";
import "./format-filter-preview.css";

const formats = ["PDF", "PNG", "CSV"];
const teams = ["Design", "Product", "Finance"];
const formatProperty = { id: "format", label: "Format", options: formats.map(value => ({ value, label: value })) };
const teamProperty = { id: "team", label: "Team", options: teams.map(value => ({ value, label: value })) };
const files = [
  { name: "Brand guidelines.pdf", format: "PDF", team: "Design", size: 2_400_000 },
  { name: "Launch cover.png", format: "PNG", team: "Design", size: 4_100_000 },
  { name: "Research summary.pdf", format: "PDF", team: "Product", size: 780_000 },
  { name: "Revenue forecast.csv", format: "CSV", team: "Finance", size: 28_000 },
];

export default function FormatFilterPreview({ mode = "select" }: { mode?: "select" | "tag" | "group" | "views" }) {
  const [format, setFormat] = useState("");
  const [team, setTeam] = useState("");
  const controlId = useId();
  const labelId = `${controlId}-label`;
  const visibleFiles = files.filter(file => (!format || file.format === format) && (!team || file.team === team));
  const showTeam = mode === "group" || mode === "views";

  return (
    <main id="main-content" tabIndex={-1} className="format-filter-preview">
      <Stack gap="4">
        <Heading level={1} size="page">Files</Heading>
        {mode === "views" && (
          <FileSavedViews formats={formats} teams={teams} filters={{ format, team }} onChange={filters => {
            setFormat(filters.format);
            setTeam(filters.team);
          }} />
        )}
        {mode !== "select" ? (
          <Inline role="group" aria-label="File filters" gap="3">
            <AppliedFilterControl property={formatProperty} value={format} onChange={setFormat} />
            {showTeam && (
              <AppliedFilterControl property={teamProperty} value={team} onChange={setTeam} />
            )}
          </Inline>
        ) : (
          <Inline gap="2" align="center">
            <Label id={labelId} htmlFor={controlId}>Format</Label>
            <div className="format-filter-preview__control">
              <Select
                id={controlId}
                aria-labelledby={labelId}
                controlSize="sm"
                value={format}
                onChange={event => setFormat(event.currentTarget.value)}
              >
                <option value="">All</option>
                {formats.map(option => <option key={option} value={option}>{option}</option>)}
              </Select>
            </div>
          </Inline>
        )}
        {visibleFiles.length ? (
          <FileList label="Files">
            {visibleFiles.map(({ name, format, size, team }) => (
              <FileItem key={name} name={name} format={format} size={size} description={showTeam ? team : undefined} />
            ))}
          </FileList>
        ) : <EmptyState title="No matching files" density="compact" />}
      </Stack>
    </main>
  );
}
