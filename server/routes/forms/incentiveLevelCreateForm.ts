import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelCreateData extends BaseFormData {
  name: string
  code: string
}

export default class IncentiveLevelCreateForm extends Form<IncentiveLevelCreateData> {
  protected validate(): void {
    this.data.name = this.data.name?.trim() ?? ''
    if (this.data.name.length < 1) {
      this.addError('name', 'The level’s name is required')
    } else if (this.data.name.length > 30) {
      this.addError('name', 'The name must be no more than 30 characters in length')
    }

    const codeRE = /^[A-Za-z0-9]{3}$/
    if (!codeRE.test(this.data.code)) {
      this.addError('code', 'The level’s code must be 3 letters or numbers')
    }
  }
}
