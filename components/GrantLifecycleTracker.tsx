import React from 'react';
import { GrantStatus, LifecycleStage } from '../types';
import { Target, PenSquare, Paperclip, Award, FileBarChart2 } from 'lucide-react';

interface GrantLifecycleTrackerProps {
  currentStatus: GrantStatus;
  onStageSelect: (stage: LifecycleStage) => void;
}

const statusToStageMap: Record<GrantStatus, LifecycleStage> = {
  'Interested': 'Discovery',
  'Applying': 'Application',
  'Submitted': 'Submission & Review',
  'Rejected': 'Submission & Review',
  'Awarded': 'Award',
};

const stages: { stage: LifecycleStage; icon: React.ReactNode }[] = [
  { stage: 'Discovery', icon: <Target size={20} /> },
  { stage: 'Application', icon: <PenSquare size={20} /> },
  { stage: 'Submission & Review', icon: <Paperclip size={20} /> },
  { stage: 'Award', icon: <Award size={20} /> },
  { stage: 'Reporting', icon: <FileBarChart2 size={20} /> },
];

const GrantLifecycleTracker: React.FC<GrantLifecycleTrackerProps> = ({ currentStatus, onStageSelect }) => {
  const currentStage = currentStatus === 'Awarded' ? 'Reporting' : statusToStageMap[currentStatus];
  const currentStageIndex = stages.findIndex(s => s.stage === currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stages.map((item, index) => {
          const isCompleted = index < currentStageIndex;
          const isActive = index === currentStageIndex;
          
          return (
            <React.Fragment key={item.stage}>
              <div className="flex flex-col items-center text-center cursor-pointer group" onClick={() => onStageSelect(item.stage)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isActive ? 'bg-primary border-primary text-white shadow-lg' : ''}
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400 group-hover:border-primary group-hover:text-primary' : ''}
                `}>
                  {item.icon}
                </div>
                <p className={`mt-2 text-xs font-semibold transition-colors duration-300
                    ${isActive ? 'text-primary' : ''}
                    ${isCompleted ? 'text-gray-700' : ''}
                    ${!isActive && !isCompleted ? 'text-gray-500 group-hover:text-primary' : ''}
                `}>
                  {item.stage}
                </p>
              </div>
              {index < stages.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default GrantLifecycleTracker;
