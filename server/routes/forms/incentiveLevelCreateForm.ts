import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelCreateData extends BaseFormData {
  name: string
  code: string
}

export default class IncentiveLevelCreateForm extends Form<IncentiveLevelCreateData> {
  protected validate(): void {
    if (!this.data.name || this.data.name.length < 1) {
      this.addError('name', 'The level’s name is required')
    }
    // TODO: add max length limit to `name` & error message once determined
    //       NOMIS has hard limit of 40, incentives DB is 30

    const codeRE = /^[A-Za-z0-9]{3}$/
    if (!codeRE.test(this.data.code)) {
      this.addError('code', 'The level’s code must be 3 letters or numbers')
    }
  }
}
