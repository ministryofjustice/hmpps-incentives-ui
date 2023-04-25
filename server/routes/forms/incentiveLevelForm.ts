import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelData extends BaseFormData {
  name: string
  availability: 'required' | 'active' | 'inactive'
}

export default class IncentiveLevelForm extends Form<IncentiveLevelData> {
  protected validate(): void {
    if (!this.data.name || this.data.name.length < 1) {
      this.addError('name', 'The level’s name is required')
    }
    if (!['required', 'active', 'inactive'].includes(this.data.availability)) {
      delete this.data.availability
      this.addError('availability', 'Availability must be chosen')
    }
  }
}
