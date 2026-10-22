# Website infrastructure

`railway.ts` uses Railway's current Infrastructure as Code SDK. It declares the
`flood-design-web` partial, which owns **only service.web**. Other legacy services,
volumes and their variables are intentionally outside this file's ownership.

Use Railway CLI 5.71+ and the pinned `railway` SDK in the root devDependencies:

```sh
railway link --project flood-md --environment staging
railway service link web
railway config plan
railway config apply
```

Review a plan before applying: it must not delete resources or change another
service. The domain remains attached to web on port 3000; the server honors PORT.
Source follows main and waits for successful GitHub checks. Application commits
autodeploy; infrastructure edits require a reviewed config apply.

On Windows the SDK's CLI version check needs the native railway.exe directory on
PATH, rather than only npm's railway.cmd shim. Use the actual installed CLI binary;
do not bypass version checks. No credentials or variable values belong in this folder.
