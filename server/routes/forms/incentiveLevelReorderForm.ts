import Form, { type BaseFormData } from './forms'

export interface IncentiveLevelReorderData extends BaseFormData {
  code: string
  direction: 'up' | 'down'
}

export default class IncentiveLevelReorderForm extends Form<IncentiveLevelReorderData> {
  protected validate(): void {
    if (!this.data.code || this.data.code.length < 1) {
      this.addError('code', 'The level’s code is required')
    }
    if (!['up', 'down'].includes(this.data.direction)) {
      this.addError('direction', 'Direction must be chosen')
    }
  }
}
