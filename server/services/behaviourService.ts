export default class BehaviourService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // async getBehaviourEntries(agencyId: string, location: Location): Promise<unknown> {
  async getBehaviourEntries(): Promise<unknown> {
    const testEntry = {
      fullName: 'Doe, John',
      offenderNo: 'A1234AB',
      daysOnLevel: 123,
      daysSinceReview: 456,
      provenAdjudications: 0,
      positivesCaseNotes: 2,
      negativesCaseNotes: 0,
      iepEncouragements: 1,
      iepWarnings: 0,
    }

    return {
      Basic: [testEntry, testEntry, testEntry],
      Standard: [testEntry, testEntry],
      Enhanced: [testEntry],
      'Enhanced 2': [testEntry],
    }
  }
}
