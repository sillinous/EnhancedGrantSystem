
import { ApplicationReview, GrantOpportunity } from '../types';

const REVIEWS_KEY = 'grantfinder_reviews';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllReviews = (): Record<string, ApplicationReview> => {
  try {
    const reviewsJson = localStorage.getItem(REVIEWS_KEY);
    return reviewsJson ? JSON.parse(reviewsJson) : {};
  } catch (error) {
    console.error("Failed to parse reviews from localStorage", error);
    return {};
  }
};

const saveAllReviews = (allReviews: Record<string, ApplicationReview>): void => {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  } catch (error) {
    console.error("Failed to save reviews to localStorage", error);
  }
};

export const getReview = (grant: GrantOpportunity): ApplicationReview | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allReviews = getAllReviews();
  return allReviews[grantId] || null;
};

export const saveReview = (grant: GrantOpportunity, review: ApplicationReview): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allReviews = getAllReviews();
  allReviews[grantId] = review;
  saveAllReviews(allReviews);
};
