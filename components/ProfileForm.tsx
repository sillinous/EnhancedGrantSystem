import React, { useState, useEffect } from 'react';
import { FundingProfile } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ProfileFormProps {
  // FIX: The `onSubmit` prop expected a profile with an `owner`, but the form state does not include it. The type has been adjusted to `Omit<FundingProfile, 'id' | 'owner'>` to match the submitted data.
  onSubmit: (profile: Omit<FundingProfile, 'id' | 'owner'>, id?: number) => void;
  isLoading: boolean;
  initialData?: FundingProfile | null;
  onCancel?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, isLoading, initialData, onCancel }) => {
  const [profile, setProfile] = useState({
    profileType: 'Business' as FundingProfile['profileType'],
    name: '',
    industry: '',
    stage: 'Startup' as FundingProfile['stage'],
    description: '',
    fundingNeeds: '',
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setProfile({
        profileType: initialData.profileType,
        name: initialData.name,
        industry: initialData.industry,
        stage: initialData.stage,
        description: initialData.description,
        fundingNeeds: initialData.fundingNeeds,
      });
    } else {
      // Reset form if initialData is cleared (e.g., on cancel or successful creation)
      setProfile({
        profileType: 'Business' as FundingProfile['profileType'],
        name: '',
        industry: '',
        stage: 'Startup' as FundingProfile['stage'],
        description: '',
        fundingNeeds: '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile, initialData?.id);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-slide-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="profileType" className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
          <select
            name="profileType"
            id="profileType"
            required
            value={profile.profileType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
          >
            <option>Individual</option>
            <option>Business</option>
            <option>Non-Profit</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., Innovatech or Personal Project"
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry / Area of Focus</label>
            <input
              type="text"
              name="industry"
              id="industry"
              required
              value={profile.industry}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., Renewable Energy or Arts"
            />
          </div>
        </div>
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">Project Stage</label>
          <select
            name="stage"
            id="stage"
            required
            value={profile.stage}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
          >
            <option>Idea</option>
            <option>Startup</option>
            <option>Growth</option>
            <option>Established</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
          <textarea
            name="description"
            id="description"
            required
            rows={4}
            value={profile.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            placeholder="Describe your core project, service, or mission."
          />
        </div>
        <div>
          <label htmlFor="fundingNeeds" className="block text-sm font-medium text-gray-700 mb-1">Specific Funding Needs</label>
          <input
            type="text"
            name="fundingNeeds"
            id="fundingNeeds"
            required
            value={profile.fundingNeeds}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            placeholder="e.g., R&D, community outreach, hiring"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <LoadingSpinner message={isEditing ? "Updating Profile..." : "Analyzing Profile..."} size="small"/>
            ) : (
             <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              {isEditing ? 'Update & Search' : 'Find My Grants'}
             </>
            )}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-center mt-3 py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
