import PrisonIncentiveLevelEditForm, { type PrisonIncentiveLevelEditData } from './prisonIncentiveLevelEditForm'

export interface PrisonIncentiveLevelCreateData extends PrisonIncentiveLevelEditData {
  levelCode: string
}

export default class PrisonIncentiveLevelCreateForm extends PrisonIncentiveLevelEditForm<PrisonIncentiveLevelCreateData> {
  constructor(formId: string, private readonly validLevelCodes: string[]) {
    super(formId)
  }

  protected validate(): void {
    super.validate()

    if (!this.validLevelCodes.includes(this.data.levelCode)) {
      this.addError('levelCode', 'Please select a level to add')
    }
  }
}
