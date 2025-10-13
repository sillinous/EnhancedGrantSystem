
import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface TeamManagerProps {
  onCreateTeam: (teamName: string) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ onCreateTeam }) => {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onCreateTeam(teamName.trim());
      setTeamName('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Create a shared workspace for your organization. Team members will be able to view and collaborate on shared funding profiles and grant applications.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
          <div className="relative">
             <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Marketing Department"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!teamName.trim()}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
        >
          Create Team
        </button>
      </form>
    </div>
  );
};

export default TeamManager;
