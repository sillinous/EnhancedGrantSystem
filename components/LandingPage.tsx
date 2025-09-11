import React from 'react';
import Header from './Header';
import { getPublicGrants } from '../services/publicGrantService';
import { Award, Search, Bot, BarChart, CheckCircle, Quote } from 'lucide-react';

const LandingPage: React.FC = () => {
    const featuredGrants = getPublicGrants().slice(0, 3);

    const navigateTo = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: string }> = ({ icon, title, children }) => (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center text-primary mb-3">
                {icon}
                <h3 className="font-bold text-lg ml-3">{title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{children}</p>
        </div>
    );
    
    return (
        <div className="bg-gray-50 font-sans text-gray-800">
            {/* FIX: Removed unsupported `isPublic` prop. */}
            <Header user={null} onLogout={() => {}} />

            {/* Hero Section */}
            <section className="bg-white">
                <div className="container mx-auto px-6 py-20 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 animate-fade-in">Find and Win Grants with AI</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in [animation-delay:0.2s]">
                        From discovery to submission, GrantFinder AI is your partner for securing the funding you need to make an impact.
                    </p>
                    <button 
                        onClick={() => navigateTo('/login')}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 animate-fade-in [animation-delay:0.4s]"
                    >
                        Get Started for Free
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Your Complete Grant Toolkit</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={<Search size={24} />} title="Smart Search">
                            Our AI scans a global database to find the most relevant funding opportunities for your unique profile.
                        </FeatureCard>
                        <FeatureCard icon={<Bot size={24} />} title="AI Writing Studio">
                            Generate high-quality drafts for every section of your grant application, from executive summaries to budget narratives.
                        </FeatureCard>
                        <FeatureCard icon={<BarChart size={24} />} title="Eligibility Analysis">
                            Get an instant, data-driven report on how well you match a grant's requirements, including a confidence score and key deadlines.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* Featured Grants Section */}
            <section className="bg-white py-16">
                 <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Featured Opportunities</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {featuredGrants.map(grant => (
                            <a 
                                key={grant.id}
                                href={`/grant/${grant.id}`}
                                onClick={(e) => { e.preventDefault(); navigateTo(`/grant/${grant.id}`); }}
                                className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg hover:border-primary/50 transition-all group"
                            >
                                <div className="flex items-center text-primary mb-2">
                                    <Award size={18} />
                                    <p className="font-semibold ml-2">{grant.funder}</p>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">{grant.name}</h3>
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{grant.description}</p>
                                <p className="text-sm font-bold text-accent mt-4 bg-accent/10 px-3 py-1 rounded-full inline-block">{grant.fundingAmount}</p>
                            </a>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <button onClick={() => navigateTo('/login')} className="text-primary font-semibold hover:underline">
                            Sign up to see more opportunities
                        </button>
                    </div>
                </div>
            </section>

             {/* Testimonial Section */}
            <section className="py-16">
                <div className="container mx-auto px-6 text-center">
                    <Quote className="text-primary mx-auto mb-4" size={40}/>
                    <p className="text-xl italic text-gray-700 max-w-3xl mx-auto">"GrantFinder AI changed the game for our non-profit. The AI Writing Studio saved us dozens of hours and helped us craft a proposal that got funded on the first try!"</p>
                    <p className="mt-4 font-semibold text-gray-800">- Jane Doe, Director at EcoInnovate</p>
                </div>
            </section>

             {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="container mx-auto px-6 py-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} GrantFinder AI. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
