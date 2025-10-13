import React, { useEffect, useState } from 'react';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import ShareButton from './ShareButton';
import { PublicGrant } from '../types';
import { getPublicGrantById } from '../services/publicGrantService';
import { setMetaTags, setStructuredData } from '../services/seoService';
import { Award, DollarSign, Target, Link, Info } from 'lucide-react';

interface PublicGrantViewProps {
  grantId: string;
}

const PublicGrantView: React.FC<PublicGrantViewProps> = ({ grantId }) => {
    const [grant, setGrant] = useState<PublicGrant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const fetchedGrant = getPublicGrantById(grantId);
        setGrant(fetchedGrant);
        setIsLoading(false);

        if (fetchedGrant) {
            const description = `Details for the ${fetchedGrant.name}, offering ${fetchedGrant.fundingAmount}. Find out more about eligibility and how to apply.`;
            setMetaTags({
                title: `${fetchedGrant.name} | GrantFinder AI`,
                description: description,
                ogTitle: `${fetchedGrant.name} on GrantFinder AI`,
                ogDescription: description,
            });
            setStructuredData({
                '@context': 'https://schema.org',
                '@type': 'FundingScheme',
                name: fetchedGrant.name,
                description: fetchedGrant.description,
                url: window.location.href,
                funder: {
                    '@type': 'Organization',
                    name: fetchedGrant.funder,
                },
            });
        } else {
             setMetaTags({ title: 'Grant Not Found | GrantFinder AI' });
        }
    }, [grantId]);

    const navigateTo = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (!grant) {
        return (
             <div className="bg-gray-50 min-h-screen">
                {/* FIX: Removed unsupported `isPublic` prop. */}
                <Header user={null} onLogout={() => {}} />
                <div className="container mx-auto text-center py-20">
                    <h1 className="text-3xl font-bold">Grant Not Found</h1>
                    <p className="text-gray-600 mt-2">The grant you are looking for does not exist or may have been removed.</p>
                </div>
            </div>
        );
    }
    
    const InfoSection: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center text-primary mb-3">
                {icon}
                <h3 className="font-bold text-lg ml-3">{title}</h3>
            </div>
            <div className="text-gray-600 text-sm space-y-2">{children}</div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* FIX: Removed unsupported `isPublic` prop. */}
            <Header user={null} onLogout={() => {}} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-6">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-semibold text-primary flex items-center mb-2"><Award size={18} className="mr-2" /> {grant.funder}</p>
                                <h1 className="text-3xl font-bold text-gray-800">{grant.name}</h1>
                             </div>
                             <ShareButton grantUrl={window.location.pathname} grantName={grant.name} />
                        </div>
                       
                        <p className="text-gray-600 mt-4">{grant.description}</p>
                         <div className="mt-6 flex flex-wrap gap-4 items-center">
                            <span className="text-lg font-bold text-accent bg-accent/10 px-4 py-2 rounded-full">
                                {grant.fundingAmount}
                            </span>
                            <a
                              href={grant.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm font-medium text-gray-600 hover:text-primary"
                            >
                              <Link size={16} className="mr-1.5" />
                              Official Grant Website
                            </a>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <InfoSection icon={<Target size={24} />} title="Eligibility">
                            <p>{grant.eligibility}</p>
                        </InfoSection>
                        <InfoSection icon={<Info size={24} />} title="About the Funder">
                            <p>{grant.funder} is a leading organization dedicated to supporting innovative projects in various sectors.</p>
                        </InfoSection>
                    </div>

                    <div className="bg-primary/10 text-center p-8 rounded-lg border-2 border-dashed border-primary/30">
                        <h2 className="text-2xl font-bold text-primary">Ready to Write Your Winning Application?</h2>
                        <p className="mt-2 text-gray-700 max-w-xl mx-auto">Sign up for GrantFinder AI to get access to our AI Writing Studio, Application Reviewer, and a full suite of tools to help you get funded.</p>
                        <button 
                            onClick={() => navigateTo('/login')}
                            className="mt-6 bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform hover:scale-105"
                        >
                            Unlock All Features
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicGrantView;
