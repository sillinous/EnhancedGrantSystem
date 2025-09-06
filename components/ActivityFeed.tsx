
import React from 'react';
import { ActivityLog } from '../types';
import { History } from 'lucide-react';

interface ActivityFeedProps {
  activityLog: ActivityLog[];
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};


const ActivityFeed: React.FC<ActivityFeedProps> = ({ activityLog }) => {
  if (activityLog.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 animate-fade-in">
        <History size={32} className="mx-auto mb-2" />
        <p>No activity has been logged for this grant yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Team Activity</h3>
        <ul className="space-y-4">
            {activityLog.map(log => (
                <li key={log.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">
                        {log.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm text-gray-700">
                           <span className="font-semibold">{log.username}</span> {log.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5" title={new Date(log.timestamp).toLocaleString()}>
                            {timeAgo(log.timestamp)}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
  );
};

export default ActivityFeed;
