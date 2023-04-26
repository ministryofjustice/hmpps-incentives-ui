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
    if (!this.data.code || this.data.code.length < 1) {
      this.addError('name', 'The level’s code is required')
    }
  }
}
