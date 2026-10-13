import { BAKERY_REVIEWS } from '../constants/bakeryReviews'

const BAKERY_ID_BY_AUTHOR = BAKERY_REVIEWS.reduce((acc, review) => {
  if (!acc[review.author]) acc[review.author] = review.bakeryId
  return acc
}, {})

export const getPostPhotoBakeryId = (post) => BAKERY_ID_BY_AUTHOR[post.author] || (((post.id - 1) % 13) + 1)
