# Deployment Notes

Deployment is usually handled through CircleCI, but sometimes it’s useful to access the cluster directly
(e.g. to diagnose problems).

## Prerequisites

Ensure you have kubectl v1.23 (or compatible) and helm v3 clients installed.

You will need to be a member of the `@ministryofjustice/hmpps-incentives` team on github and
have authenticated kubectl with [Cloud Platform](https://user-guide.cloud-platform.service.justice.gov.uk/).

## Environments & namespaces

| Environment | Kubernetes namespace     |
|-------------|--------------------------|
| dev         | hmpps-incentives-dev     |
| preprod     | hmpps-incentives-preprod |
| prod        | hmpps-incentives-prod    |


## Useful commands (run from this directory)

List all current releases (not just this chart):

```shell
helm --namespace ${NAMESPACE} list
```

List history of this chart’s releases:

```shell
helm --namespace ${NAMESPACE} history hmpps-incentives-ui
```

Roll this chart back to a previous release (where `${REVISION_NUMBER}` is taken from the history list):

```shell
helm --namespace ${NAMESPACE} rollback hmpps-incentives-ui ${REVISION_NUMBER} --wait
```

Lint the chart templates:

```shell
helm --namespace ${NAMESPACE} lint \
  ./hmpps-incentives-ui --values values-${ENVIRONMENT}.yaml \
  --strict --with-subcharts --debug
```

Render complete chart for debugging:

```shell
helm template ./hmpps-incentives-ui --values values-${ENVIRONMENT}.yaml
```

Manually deploy the complete helm chart:

```shell
helm upgrade hmpps-incentives-ui ./hmpps-incentives-ui \
  --install --wait --force --reset-values --timeout 5m --history-max 10 \
  --dry-run \  # remove to actually deploy
  --namespace ${NAMESPACE} \
  --values values-${ENVIRONMENT}.yaml \
  --set generic-service.image.tag=${APP_VERSION}  # this is normally set by CI as [date]-[build number]-[git commit], e.g. 2022-07-11.5276.677f0a8
```
