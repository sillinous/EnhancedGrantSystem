
import React, { useState } from 'react';
import { Share2, Link, Check } from 'lucide-react';

interface ShareButtonProps {
  grantUrl: string;
  grantName: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ grantUrl, grantName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const fullUrl = `${window.location.origin}${grantUrl}`;

  const socialShares = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(`Check out this grant opportunity: ${grantName}`)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(grantName)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setHasCopied(true);
    setTimeout(() => {
        setHasCopied(false);
        setIsOpen(false);
    }, 1500);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-primary"
      >
        <Share2 size={16} className="mr-1.5" />
        Share
      </button>
      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 animate-fade-in"
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="p-2">
                <a href={socialShares.twitter} target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Share on Twitter</a>
                <a href={socialShares.linkedin} target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Share on LinkedIn</a>
                <a href={socialShares.facebook} target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Share on Facebook</a>
                <div className="border-t my-1"></div>
                <button onClick={handleCopyLink} className="flex items-center justify-between w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    {hasCopied ? 'Copied!' : 'Copy Link'}
                    {hasCopied ? <Check size={16} className="text-green-600" /> : <Link size={16} />}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
