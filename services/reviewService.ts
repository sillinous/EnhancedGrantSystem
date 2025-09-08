import { ApplicationReview, GrantOpportunity, RedTeamReview } from '../types';

const REVIEWS_KEY = 'grantfinder_reviews';
const RED_TEAM_REVIEWS_KEY = 'grantfinder_redTeamReviews';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

// --- Constructive Application Review ---

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


// --- Red Team Review ---

const getAllRedTeamReviews = (): Record<string, RedTeamReview> => {
  try {
    const reviewsJson = localStorage.getItem(RED_TEAM_REVIEWS_KEY);
    return reviewsJson ? JSON.parse(reviewsJson) : {};
  } catch (error) {
    console.error("Failed to parse red team reviews from localStorage", error);
    return {};
  }
};

const saveAllRedTeamReviews = (allReviews: Record<string, RedTeamReview>): void => {
  try {
    localStorage.setItem(RED_TEAM_REVIEWS_KEY, JSON.stringify(allReviews));
  } catch (error)
    {
    console.error("Failed to save red team reviews to localStorage", error);
  }
};

export const getRedTeamReview = (grant: GrantOpportunity): RedTeamReview | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allReviews = getAllRedTeamReviews();
  return allReviews[grantId] || null;
};

export const saveRedTeamReview = (grant: GrantOpportunity, review: RedTeamReview): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allReviews = getAllRedTeamReviews();
  allReviews[grantId] = review;
  // FIX: Called `saveAllRedTeamReviews` instead of `saveAllReviews` to use the correct serializer and storage key for RedTeamReview objects.
  saveAllRedTeamReviews(allReviews);
};