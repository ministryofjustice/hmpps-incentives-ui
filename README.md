# HMPPS Incentives UI

This application is a front-end application used by staff in HMPPS prisons to view offenders’ incentive level information.

It is backed by [hmpps-incentives-api](https://github.com/ministryofjustice/hmpps-incentives-api).

[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/hmpps-incentives-ui/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/hmpps-incentives-ui)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://github.com/ministryofjustice/hmpps-incentives-ui/pkgs/container/hmpps-incentives-ui)

## Running locally

The UI application needs a suite of services to work:

* redis – to store user session data
* AWS S3 (or minio) – to load analytics data
* hmpps-auth – to authenticate users
* nomis-user-roles-api – to authenticate users
* prison-api – to retrieve offender information
* incentives-api – to retrieve incentive level information

### Requirements

This application is built for Node.js and docker will be needed to run it locally.
[`nvm`](https://github.com/nvm-sh/nvm) or [`fnm`](https://github.com/Schniz/fnm)
can be used to install appropriate node versions, e.g.:

```shell
nvm use
# or
fnm use
```

Additional tools are required to manage deployment: `kubectl` and `helm`.

### Using services in `dev` environment

This is the easiest way to run and develop on your machine: by hooking into services that already exist
in the `dev` environment.
A user account is needed in hmpps-auth with the appropriate roles.

Copy the `.env.sample` file to `.env` following the instructions in the file.

Run the application in development mode, in separate shell sessions:

```shell
docker compose -f docker-compose-test.yml up
npm run start:dev
```

This will automatically restart it if server code or front-end assets are modified.

### Using only local services

**TODO:** the environment/settings are not properly set up for this application to work without using external services!

### Updating dependencies

It’s prudent to periodically update npm dependencies; continuous integration will occasionally warn when it’s needed.
Renovate (similar to dependabot) is set up to try to upgrade
npm packages, base docker images, helm charts and GH Actions workflows
by raising pull requests.

This will attempt update npm packages manually and perform unit tests:

```shell
npx npm-check-updates --upgrade --doctor
```

## Testing

Continuous integration on GitHub Actions will always perform the full suite of tests on pull requests and branches pushed to github,
but they can be run locally too.

### Unit tests

Run unit tests using:

```shell
npm test
```

…optionally passing a file path pattern to only run a subset:

```shell
npm test -- authorisationMiddleware
```

### Integration tests

Run the full set of headless integration tests, in separate shell sessions:

```shell
docker compose -f docker-compose-test.yml up
npm run start-feature
npm run int-test
```

Integration tests can also be run in development mode with a UI
so that assets are rebuilt when modified and tests will re-run:

```shell
docker compose -f docker-compose-test.yml up
npm run start-feature:dev
npm run int-test-ui
```

### Code style tests

Type-checking is performed with:

```shell
npm run typecheck
```

Prettier should automatically correct many stylistic errors when changes are committed,
but the linter can also be run manually:

```shell
npm run lint
```

### Security tests

Continuous integration will regularly perform security checks using nm security audit, trivy and veracode.

The npm audit can be run manually:

```shell
npx audit-ci --config audit-ci.json
```

## Hosting

This application is hosted on [Cloud Platform](https://user-guide.cloud-platform.service.justice.gov.uk/)
in three environments:
`dev` (continuously deployed and experimental; for general testing),
`preprod` (largely matches the live service; for pre-release testing)
and `prod` (the live service).

The environments are distinct namespaces defined using a combination of kubernetes resources and terraform templates:

* [`dev`](https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/hmpps-incentives-dev)
* [`preprod`](https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/hmpps-incentives-preprod)
* [`prod`](https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/hmpps-incentives-prod)

A shared HMPPS helm chart forms the basis of releases,
setting up a deployment, service, ingress and associated policies and monitoring rules.

See `/helm_deploy/`.

### Deployment

When the main branch is updated (e.g. when a pull request is merged),
a new version of the application is released to `dev` automatically by GitHub Actions.
This release can be promoted to `preprod` and `prod` using the GitHub Actions interface to approve the deployment.

See `/helm_deploy/README.md` for manual deployment steps.

### Monitoring

There is a suite of tools used for monitoring deployed applications:

* [Kibana](https://kibana.cloud-platform.service.justice.gov.uk/_plugin/kibana/app/kibana) – logging
* [Azure Application Insights](https://portal.azure.com/) – application profiling and introspection
* [Prometheus](https://prometheus.cloud-platform.service.justice.gov.uk/) – application and request metrics
* [Alertmanager](https://alertmanager.live.cloud-platform.service.justice.gov.uk/) – alerts based on metrics
* [SonarCloud](https://sonarcloud.io/project/overview?id=ministryofjustice_hmpps-incentives-ui) – code quality monitoring

## References

The code in this repository uses the MIT licence.

* [MoJ security guidance](https://security-guidance.service.justice.gov.uk/)
* [MoJ technical guidance](https://technical-guidance.service.justice.gov.uk/)
