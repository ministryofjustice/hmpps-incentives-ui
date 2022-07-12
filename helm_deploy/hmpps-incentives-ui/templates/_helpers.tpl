{{/* Common labels; like generic-service.labels but excludes "app" label */}}
{{- define "incentives.labels" -}}

release: {{ .Release.Name }}
helm.sh/chart: {{ include "generic-service.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if index .Values "generic-service" "image" "tag" }}
app.kubernetes.io/version: {{ index .Values "generic-service" "image" "tag" | quote }}
{{- end -}}

{{- end }}
