import { PublicGrant } from '../types';

const featuredGrants: PublicGrant[] = [
  {
    id: 'tech-innovators-grant-aHR0cHM6Ly9ncmFudHMuY29tL3RlY2g=',
    name: 'Tech Innovators Grant 2024',
    description: 'A fund dedicated to supporting early-stage startups that are developing groundbreaking technology to solve global challenges.',
    fundingAmount: '$50,000 - $250,000',
    url: 'https://grants.com/tech-innovators-2024',
    funder: 'Innovate Foundation',
    eligibility: 'Open to pre-seed and seed stage technology startups globally. Must have a working prototype or MVP.',
    // FIX: Add missing properties to satisfy the PublicGrant type.
    industry: 'Technology',
    deadline: '2024-12-31',
  },
  {
    id: 'community-arts-project-fund-aHR0cHM6Ly9ncmFudHMuY29tL2FydHM=',
    name: 'Community Arts Project Fund',
    description: 'Supports local artists and organizations in creating public art projects that foster community engagement and cultural expression.',
    fundingAmount: 'Up to $15,000',
    url: 'https://grants.com/community-arts-fund',
    funder: 'Creative Communities Alliance',
    eligibility: 'Open to individual artists and non-profit organizations located within the United States.',
    // FIX: Add missing properties to satisfy the PublicGrant type.
    industry: 'Arts & Culture',
    deadline: 'Rolling',
  },
  {
    id: 'green-energy-research-grant-aHR0cHM6Ly9ncmFudHMuY29tL2dyZWVu',
    name: 'Green Energy Research Grant',
    description: 'Funding for academic researchers and institutions exploring new frontiers in renewable energy and sustainability.',
    fundingAmount: '$100,000 - $500,000',
    url: 'https://grants.com/green-energy-research',
    funder: 'Global Sustainability Council',
    eligibility: 'Applicants must be affiliated with an accredited university or research institution. Focus on solar, wind, and battery technology.',
    // FIX: Add missing properties to satisfy the PublicGrant type.
    industry: 'Renewable Energy',
    deadline: '2025-03-15',
  },
  {
    id: 'empower-women-in-business-grant-aHR0cHM6Ly9ncmFudHMuY29tL3dvbWVu',
    name: 'Empower Women in Business Grant',
    description: 'Provides capital and mentorship for businesses founded and led by women, aiming to close the gender gap in entrepreneurship.',
    fundingAmount: '$25,000',
    url: 'https://grants.com/empower-women-grant',
    funder: 'SheLeads Ventures',
    eligibility: 'For-profit businesses with at least 51% female ownership, operating for at least one year.',
    // FIX: Add missing properties to satisfy the PublicGrant type.
    industry: 'Business',
    deadline: 'Varies',
  },
];

export const getPublicGrants = (): PublicGrant[] => {
  return featuredGrants;
};

export const getPublicGrantById = (id: string): PublicGrant | null => {
  return featuredGrants.find(grant => grant.id === id) || null;
};
