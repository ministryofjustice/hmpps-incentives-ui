import PrisonIncentiveLevelEditForm, { type PrisonIncentiveLevelEditData } from './prisonIncentiveLevelEditForm'

export interface PrisonIncentiveLevelAddData extends PrisonIncentiveLevelEditData {
  levelCode: string
}

export default class PrisonIncentiveLevelAddForm extends PrisonIncentiveLevelEditForm<PrisonIncentiveLevelAddData> {
  protected readonly mustBeDefaultOnAdmissionError =
    'The first level you add must be the default level for new prisoners. ' +
    'You can change this later when adding other levels.'

  constructor(
    formId: string,
    private readonly validLevelCodes: string[],
    mustBeDefaultOnAdmission: boolean,
  ) {
    super(formId, mustBeDefaultOnAdmission)
  }

  protected validate(): void {
    if (!this.validLevelCodes.includes(this.data.levelCode)) {
      this.addError('levelCode', 'Select a level to add')
    }

    super.validate()
  }
}
