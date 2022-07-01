import Form, { type BaseFormData } from './forms'

export interface AboutPageFeedbackData extends BaseFormData {
  informationUseful: 'yes' | 'no'
  yesComments: string
  noComments: string
}

export default class AboutPageFeedbackForm extends Form<AboutPageFeedbackData> {
  protected validate(): void {
    const { informationUseful } = this.data
    if (informationUseful === 'yes') {
      this.data.yesComments = (this.data.yesComments ?? '').trim()
      delete this.data.noComments
    } else if (informationUseful === 'no') {
      this.data.noComments = (this.data.noComments ?? '').trim()
      delete this.data.yesComments
    } else {
      this.addError('informationUseful', 'Tell us if you found this information useful')
      delete this.data.informationUseful
    }
  }
}
