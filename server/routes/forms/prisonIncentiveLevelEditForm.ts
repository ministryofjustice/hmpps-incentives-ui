import Form, { type BaseFormData } from './forms'
import { currencyInputRE } from '../../utils/utils'

export interface PrisonIncentiveLevelEditData extends BaseFormData {
  defaultOnAdmission?: 'yes' | ''

  remandTransferLimit: string
  remandSpendLimit: string
  convictedTransferLimit: string
  convictedSpendLimit: string

  visitOrders: string
  privilegedVisitOrders: string
}

export default class PrisonIncentiveLevelEditForm<
  Data extends PrisonIncentiveLevelEditData = PrisonIncentiveLevelEditData,
> extends Form<Data> {
  protected mustBeDefaultOnAdmissionError =
    'There must be a default level for new prisoners. Please select another one to be the default first.'

  constructor(formId: string, protected readonly mustBeDefaultOnAdmission: boolean) {
    super(formId)
  }

  protected validate(): void {
    if (this.data.defaultOnAdmission && this.data.defaultOnAdmission !== 'yes') {
      this.addError('defaultOnAdmission', 'Invalid value')
    } else if (this.mustBeDefaultOnAdmission && this.data.defaultOnAdmission !== 'yes') {
      this.addError('defaultOnAdmission', this.mustBeDefaultOnAdmissionError)
    }

    if (!currencyInputRE.test(this.data.remandTransferLimit)) {
      this.addError('remandTransferLimit', 'Transfer limit for remand prisoners must be in pounds and pence')
    }
    if (!currencyInputRE.test(this.data.convictedTransferLimit)) {
      this.addError('convictedTransferLimit', 'Transfer limit for convicted prisoners must be in pounds and pence')
    }

    if (!currencyInputRE.test(this.data.remandSpendLimit)) {
      this.addError('remandSpendLimit', 'Spend limit for remand prisoners must be in pounds and pence')
    }
    if (!currencyInputRE.test(this.data.convictedSpendLimit)) {
      this.addError('convictedSpendLimit', 'Spend limit for convicted prisoners must be in pounds and pence')
    }

    const number = /^\d+$/
    if (!number.test(this.data.visitOrders)) {
      this.addError('visitOrders', 'Visit orders must be a number')
    }
    if (!number.test(this.data.privilegedVisitOrders)) {
      this.addError('privilegedVisitOrders', 'Privileged visit orders must be a number')
    }
  }
}
