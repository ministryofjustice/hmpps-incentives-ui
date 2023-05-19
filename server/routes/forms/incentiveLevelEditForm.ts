import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelEditData extends BaseFormData {
  name: string
  availability: 'required' | 'active' | 'inactive'
}

export default class IncentiveLevelEditForm extends Form<IncentiveLevelEditData> {
  protected validate(): void {
    this.data.name = this.data.name?.trim() ?? ''
    if (this.data.name.length < 1) {
      this.addError('name', 'The level’s name is required')
    } else if (this.data.name.length > 30) {
      this.addError('name', 'The name must be no more than 30 characters in length')
    }

    if (!['required', 'active', 'inactive'].includes(this.data.availability)) {
      delete this.data.availability
      this.addError('availability', 'Availability must be chosen')
    }
  }
}
