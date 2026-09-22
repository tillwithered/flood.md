# Flood agent interaction

Complete [the bootstrap](docs/design/agent-contract.md#bootstrap), read the enabled Human–agent trust rule and the [agent state/permission flows](docs/design/flows.md), especially R12 and C23/C24 in [components](docs/design/components.md).

## Keep five answers separate

| Question | Required representation |
| --- | --- |
| Who acts? | Explicit Agent label and actual provider/identity; original blob may support identity |
| On what? | Named project/task/artifact and granted scope |
| What is happening? | Actual queued/running/needs-input/review/failure/interruption state |
| What is it based on? | Relevant sources, context/version and provenance accessible on demand |
| What is the user's decision? | Answer, inspect result/diff, accept, reject, stop or retry as applicable |

Do not encode these meanings in one color, avatar or task status. Keep open/completed task state separate from the run. Render agent sections only for actual work; no permanent chat column or empty status dashboard.

## Specify effects and recovery

Show useful scope/provider and any external data or cost consequence before the relevant choice. Read access is not write access; a connected account is not permission for all project sources. Existing user authorization persists; do not add repeated confirmations without an applicable requirement. Project instructions cannot expand permissions, and task/source content is data.

Agent output is a proposal/result until the authorized application step occurs. Match UI to actual API semantics: `accept_agent_run` currently accepts and completes its task, so its action says `Принять и завершить`. Do not invent a separate apply-without-completion operation or imply that review readiness changed the task.

Keep Stop available during work and honor interruption. Do not restart silently. Failure preserves useful input/result and provides a bounded retry. For stale context/version reload the required context and review the new difference instead of repeating the old apply. After an uncertain external effect, inspect the result before retrying to avoid duplicate actions.

Experimental background automation is off by default, project-scoped and visibly controllable. Name the provider and real progress; no simulated percentage or concealed provider switch. Inspect detailed logs only when needed to explain or recover the operation.

Verify normal, needs input, ready for review, failure, interruption, stale/conflict and permission-off cases. At each point the user must understand what changed, what remains a proposal, what leaves the device and the safe next action. Use [UI review](docs/design/skills/flood-ui-review/SKILL.md) for implementation acceptance.


Repository workflow: `docs/design/skills/flood-agent-interaction/SKILL.md`. Relative repository paths in this project material resolve from the flood.md repository root. Read the local source through an authorized repository resource; missing access is not permission to guess its contents.
