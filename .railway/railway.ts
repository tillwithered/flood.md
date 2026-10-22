import { defineRailway, github, project, service } from "railway/iac";

// Own only the website. Legacy backend services and volumes remain unmanaged.
export const partial = "flood-design-web";

export default defineRailway(() => {
  const web = service("web", {
    source: github("tillwithered/flood.md", { branch: "main", checkSuites: true }),
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: ["/**"],
    },
    healthcheck: "/health",
    healthcheckTimeout: 30,
    replicas: { ams: 1 },
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 3 },
    domains: [{ domain: "flood.md", port: 3000 }],
  });

  return project("flood-md", {
    variables: { managed: false },
    resources: [web],
  });
});
