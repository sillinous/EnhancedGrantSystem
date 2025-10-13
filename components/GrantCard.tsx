
import React from 'react';
import { GrantOpportunity, GrantStatus } from '../types';

interface GrantCardProps {
  grant: GrantOpportunity & { status: GrantStatus };
  onSelectForDetail: () => void;
  isDetailedView: boolean;
  isSelectMode: boolean;
  isBulkSelected: boolean;
  onToggleBulkSelect: () => void;
}

const statusStyles: Record<GrantStatus, string> = {
  Interested: 'bg-blue-100 text-blue-800 border-blue-200',
  Applying: 'bg-orange-100 text-orange-800 border-orange-200',
  Submitted: 'bg-purple-100 text-purple-800 border-purple-200',
  Awarded: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

const GrantCard: React.FC<GrantCardProps> = ({ grant, onSelectForDetail, isDetailedView, isSelectMode, isBulkSelected, onToggleBulkSelect }) => {
  const handleClick = () => {
    if (isSelectMode) {
      onToggleBulkSelect();
    } else {
      onSelectForDetail();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-5 bg-white rounded-lg shadow-md border cursor-pointer transition-all duration-200 flex items-start gap-4 ${
        isDetailedView ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:shadow-xl hover:border-primary/50'
      } ${
        isBulkSelected ? 'bg-primary/10 border-primary' : ''
      }`}
    >
      {isSelectMode && (
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isBulkSelected}
            onChange={onToggleBulkSelect}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            aria-label={`Select grant: ${grant.name}`}
          />
        </div>
      )}
      <div className="flex-grow">
        <h3 className="font-bold text-lg text-gray-800">{grant.name}</h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{grant.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
            {grant.fundingAmount || 'Varies'}
          </span>
           <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusStyles[grant.status]}`}>
            {grant.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GrantCard;