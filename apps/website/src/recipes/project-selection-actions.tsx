import { useState } from 'react';
import { AlertDialog, BulkActionBar, VisuallyHidden } from '@flood-md/react';

export type ProjectStatus = 'active' | 'paused' | 'archived';
export interface SelectedProject { id: string; name: string }
export interface ProjectStatusUpdate { ids: string[]; status: ProjectStatus }

export function ProjectSelectionActions({ projects, pending, onUpdate, onClear }: {
  projects: readonly SelectedProject[];
  pending: boolean;
  onUpdate: (update: ProjectStatusUpdate) => void;
  onClear: () => void;
}) {
  const [archive, setArchive] = useState<SelectedProject[] | null>(null);

  return <>
    <BulkActionBar label="Selected projects" selectionCount={projects.length} pending={pending}
      items={[
        { id: 'archive', label: 'Archive', priority: 10 },
        { id: 'paused', label: 'Pause', priority: 5 },
        { id: 'active', label: 'Set active' },
      ]}
      onAction={action => {
        if (action === 'archive') setArchive(projects.map(project => ({ ...project })));
        else onUpdate({ ids: projects.map(project => project.id), status: action as ProjectStatus });
      }}
      onClear={onClear} />
    <VisuallyHidden role="status">{pending ? 'Updating…' : ''}</VisuallyHidden>
    {archive && <AlertDialog
        title={`Archive ${archive.length} ${archive.length === 1 ? 'project' : 'projects'}?`}
        description={`${archive.map(project => project.name).join(', ')} will move to Archived.`}
        confirmLabel="Archive projects"
        cancelLabel="Keep projects"
        open
        onOpenChange={open => { if (!open) setArchive(null); }}
        onConfirm={() => {
          onUpdate({ ids: archive.map(project => project.id), status: 'archived' });
        }}
        trigger={() => null}
      />}
  </>;
}
