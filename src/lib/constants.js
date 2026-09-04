/** The canonical lead pipeline, in order. */
export const STAGES = [
  'new',
  'contacted',
  'test_drive',
  'negotiation',
  'order_placed',
  'delivered',
]

/** Stages where the lead is still live and someone should be working it. */
export const OPEN_STAGES = STAGES.slice(0, 5)

export const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  test_drive: 'Test Drive',
  negotiation: 'Negotiation',
  order_placed: 'Order Placed',
  delivered: 'Delivered',
  lost: 'Lost',
}

export const SOURCE_LABELS = {
  walk_in: 'Walk-in',
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  phone_enquiry: 'Phone Enquiry',
  auto_expo: 'Auto Expo',
}

/**
 * A live lead untouched for this many days has fallen out of its normal
 * working rhythm — median contacted -> test drive is about 6 days.
 */
export const COLD_LEAD_DAYS = 7

/**
 * An order older than this without a delivery is stalled. Median order to
 * delivery in this data is 17 days, so 30 is comfortably abnormal.
 */
export const STALLED_ORDER_DAYS = 30
