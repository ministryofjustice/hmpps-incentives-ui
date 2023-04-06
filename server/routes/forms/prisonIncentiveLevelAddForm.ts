import PrisonIncentiveLevelEditForm, { type PrisonIncentiveLevelEditData } from './prisonIncentiveLevelEditForm'

export interface PrisonIncentiveLevelAddData extends PrisonIncentiveLevelEditData {
  levelCode: string
}

export default class PrisonIncentiveLevelAddForm extends PrisonIncentiveLevelEditForm<PrisonIncentiveLevelAddData> {
  constructor(formId: string, private readonly validLevelCodes: string[]) {
    super(formId)
  }

  protected validate(): void {
    if (!this.validLevelCodes.includes(this.data.levelCode)) {
      this.addError('levelCode', 'Please select a level to add')
    }

    super.validate()
  }
}
