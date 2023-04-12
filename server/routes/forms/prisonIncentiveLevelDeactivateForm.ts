import Form, { type BaseFormData } from './forms'

export interface PrisonIncentiveLevelDeactivateData extends BaseFormData {
  confirmation: 'yes' | 'no'
}

export default class PrisonIncentiveLevelDeactivateForm extends Form<PrisonIncentiveLevelDeactivateData> {
  protected validate(): void {
    if (!['yes', 'no'].includes(this.data.confirmation)) {
      this.addError('confirmation', 'Select yes or no')
    }
  }
}
