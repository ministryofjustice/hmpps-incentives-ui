import type { RequestHandler } from 'express'
import { MethodNotAllowed } from 'http-errors'

export interface BaseFormData {
  /**
   * Unique identifier to distinguish multiple forms on one page
   */
  formId: string
}

/**
 * An item passed into the `errorList` property of a GOV.UK error summary component
 * https://design-system.service.gov.uk/components/error-summary/
 */
export interface ErrorSummaryItem {
  text: string
  href: string
}

/**
 * An item passed into the `items` property of a GOV.UK select component
 * https://design-system.service.gov.uk/components/select/
 */
export interface GovukSelectItem {
  text: string
  value?: string
  selected?: boolean
  disabled?: boolean
  attributes?: object
}

/**
 * Base form providing simple validation extension points and per-field error messages
 */
export default abstract class Form<Data extends BaseFormData> {
  /**
   * Posted form data, undefined indicates that the form has not been submitted/POSTed
   * NB: it may be transformed in place by validation
   */
  protected data?: Partial<Data>

  /**
   * Holds per-field error messages
   */
  private readonly fieldErrors: Partial<Record<keyof Data, string>>

  constructor(
    /**
     * Unique identifier to distinguish multiple forms on one page
     */
    readonly formId: string,
  ) {
    this.fieldErrors = {}
  }

  public toString(): string {
    return `[Form formId=${this.formId} submitted=${this.submitted} hasErrors=${this.hasErrors}]`
  }

  /**
   * Set the submitted/POSTed form data triggering validation
   */
  public submit(data: Partial<Data>): void {
    if (data.formId !== this.formId) {
      throw new Error('Data not submitted by this form')
    }
    this.data = data
    this.validate()
  }

  /**
   * Whether the form was submitted/POSTed or is blank
   */
  public get submitted() {
    return typeof this.data !== 'undefined'
  }

  /**
   * Extension point: subclasses perform validation and manupulation of `this.data`
   */
  protected abstract validate(): void

  /**
   * Subclasses set errors on fields
   */
  protected addError(field: keyof Data, error: string): void {
    this.fieldErrors[field] = error
  }

  /**
   * Whether the form has validation errors
   */
  public get hasErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0
  }

  /**
   * List of errors in the form used by GOV.UK error summary component
   */
  public get errorList(): ReadonlyArray<ErrorSummaryItem> {
    return Object.entries(this.fieldErrors).map(([field, error]) => {
      return { text: error, href: `#${this.formId}-${field}` }
    })
  }

  /**
   * Field information: value if submitted and error message if any
   */
  public getField<Field extends keyof Data>(field: Field): Readonly<{ value?: Data[Field]; error?: string }> {
    return {
      value: this.data?.[field],
      error: this.fieldErrors[field],
    }
  }
}

export const requireGetOrPost: RequestHandler = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    next(new MethodNotAllowed())
    return
  }
  next()
}
