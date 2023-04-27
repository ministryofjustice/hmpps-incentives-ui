import type { IncentiveLevel } from '../../data/incentivesApi'
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

  /** @throws Error */
  reorderIncentiveLevels(incentiveLevels: IncentiveLevel[]): string[] {
    const incentiveLevelCodes = incentiveLevels.map(incentiveLevel => incentiveLevel.code)

    const levelCode = this.getField('code').value
    const moveDirection = this.getField('direction').value

    const previousIndex = incentiveLevelCodes.findIndex(incentiveLevelCode => incentiveLevelCode === levelCode)
    if (typeof previousIndex !== 'number' || previousIndex < 0) {
      throw new Error('Cannot find level to move!')
    }
    const newIndex = moveDirection === 'up' ? previousIndex - 1 : previousIndex + 1
    if (newIndex < 0) {
      throw new Error('Cannot move first incentive level up!')
    }
    if (newIndex >= incentiveLevelCodes.length) {
      throw new Error('Cannot move last incentive level down!')
    }
    const level1 = incentiveLevelCodes[previousIndex]
    const level2 = incentiveLevelCodes[newIndex]
    incentiveLevelCodes[newIndex] = level1
    incentiveLevelCodes[previousIndex] = level2

    return incentiveLevelCodes
  }
}
