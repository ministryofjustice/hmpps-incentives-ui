import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelStatusData extends BaseFormData {
  status: 'active' | 'inactive'
}

export default class IncentiveLevelStatusForm extends Form<IncentiveLevelStatusData> {
  protected validate(): void {
    if (!['active', 'inactive'].includes(this.data.status)) {
      this.addError('status', 'Select an option')
    }
  }
}
