
import { FundingProfile } from '../types';

const PROFILES_KEY = 'grantfinder_funding_profiles';

const defaultProfiles: FundingProfile[] = [
    {
        id: 1001,
        name: 'EcoInnovate Foundation',
        profileType: 'Non-Profit',
        industry: 'Environmental Conservation',
        stage: 'Established',
        description: 'A non-profit dedicated to funding and supporting projects that address climate change through technological innovation and community action.',
        fundingNeeds: 'Operational costs, project scaling, research grants for partners',
        owner: { type: 'team', id: 101 }
    },
    {
        id: 1002,
        name: 'Aperture Science Labs',
        profileType: 'Business',
        industry: 'Scientific Research & Development',
        stage: 'Growth',
        description: 'A cutting-edge research firm developing next-generation portal technology and AI assistants.',
        fundingNeeds: 'R&D for new portal gun, GLaDOS maintenance, facility expansion',
        owner: { type: 'team', id: 101 }
    },
     {
        id: 1,
        name: 'Personal Art Project',
        profileType: 'Individual',
        industry: 'Digital Art & Media',
        stage: 'Idea',
        description: 'A personal project to create a series of interactive digital sculptures exploring the intersection of nature and technology.',
        fundingNeeds: 'Hardware (VR headset, high-spec PC), software licenses, marketing budget',
        owner: { type: 'user', id: 1 }
    }
];


export const getProfiles = (): FundingProfile[] => {
  try {
    const profilesJson = localStorage.getItem(PROFILES_KEY);
     if (profilesJson) {
      return JSON.parse(profilesJson);
    } else {
      // If no profiles are in storage, initialize with defaults
      localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
      return defaultProfiles;
    }
  } catch (error) {
    console.error("Failed to parse profiles from localStorage", error);
    return [];
  }
};

export const saveProfiles = (profiles: FundingProfile[]): void => {
  try {
    const profilesJson = JSON.stringify(profiles);
    localStorage.setItem(PROFILES_KEY, profilesJson);
  } catch (error) {
    console.error("Failed to save profiles to localStorage", error);
  }
};
