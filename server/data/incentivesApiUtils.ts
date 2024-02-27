import type { IncentiveReviewHistory, IncentiveReviewHistoryItem } from './incentivesApi'

export function convertIncentiveReviewHistoryDates(
  incentiveHistory: DatesAsStrings<IncentiveReviewHistory>,
): IncentiveReviewHistory {
  return {
    ...incentiveHistory,
    // convert string date to js _midday_ datetime to avoid timezone offsets
    iepDate: new Date(`${incentiveHistory.iepDate}T12:00:00`),
    iepTime: new Date(incentiveHistory.iepTime),
    // convert string date to js _midday_ datetime to avoid timezone offsets
    nextReviewDate: new Date(`${incentiveHistory.nextReviewDate}T12:00:00`),
    iepDetails: incentiveHistory.iepDetails.map(convertIncentiveReviewItemDates),
  }
}

export function convertIncentiveReviewItemDates(
  incentiveReview: DatesAsStrings<IncentiveReviewHistoryItem>,
): IncentiveReviewHistoryItem {
  return {
    ...incentiveReview,
    // convert string date to js _midday_ datetime to avoid timezone offsets
    iepDate: new Date(`${incentiveReview.iepDate}T12:00:00`),
    iepTime: new Date(incentiveReview.iepTime),
  }
}
