import Form, { type BaseFormData } from './forms'
import { currencyInputRE } from '../../utils/utils'

export interface PrisonIncentiveLevelData extends BaseFormData {
  remandTransferLimit: string
  remandSpendLimit: string
  convictedTransferLimit: string
  convictedSpendLimit: string

  visitOrders: string
  privilegedVisitOrders: string
}

export default class PrisonIncentiveLevelForm extends Form<PrisonIncentiveLevelData> {
  protected validate(): void {
    if (!currencyInputRE.test(this.data.remandTransferLimit)) {
      delete this.data.remandTransferLimit
      this.addError('remandTransferLimit', 'Remand transfer limit must be in pounds and pence')
    }
    if (!currencyInputRE.test(this.data.remandSpendLimit)) {
      delete this.data.remandSpendLimit
      this.addError('remandSpendLimit', 'Remand spend limit must be in pounds and pence')
    }
    if (!currencyInputRE.test(this.data.convictedTransferLimit)) {
      delete this.data.convictedTransferLimit
      this.addError('convictedTransferLimit', 'Convicted transfer limit must be in pounds and pence')
    }
    if (!currencyInputRE.test(this.data.convictedSpendLimit)) {
      delete this.data.convictedSpendLimit
      this.addError('convictedSpendLimit', 'Convicted spend limit must be in pounds and pence')
    }

    const number = /^\d+$/
    if (!number.test(this.data.visitOrders)) {
      delete this.data.visitOrders
      this.addError('visitOrders', 'Visits per fortnight must be a number')
    }
    if (!number.test(this.data.privilegedVisitOrders)) {
      delete this.data.privilegedVisitOrders
      this.addError('privilegedVisitOrders', 'Privileged visits per 4 weeks must be a number')
    }
  }
}
