export default class Form<Data extends { formId: string }> {
  // posted form data; NB: it may be transformed in place by validation
  data: Partial<Data>

  // fields with error messages; for use with error message components
  fieldErrors: Partial<Record<keyof Data, string>>

  constructor(data: Partial<Data>) {
    this.data = data
    this.fieldErrors = {}
  }

  get hasErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0
  }

  // for use with error summary component
  get errorSummary(): { text: string; href: string }[] {
    return Object.entries(this.fieldErrors).map(([field, error]) => {
      return { text: error, href: `#${this.data.formId}-${field}` }
    })
  }
}
