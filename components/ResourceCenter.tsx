
import React, { useEffect } from 'react';
import Header from './Header';
import { setMetaTags } from '../services/seoService';
import { BookOpen, Edit } from 'lucide-react';

const ResourceCenter: React.FC = () => {
    useEffect(() => {
        setMetaTags({
            title: 'Grant Writing Resource Center | GrantFinder AI',
            description: 'Expert tips, articles, and guides on how to write winning grant applications. Learn how to find opportunities, draft proposals, and secure funding.'
        });
    }, []);

    const articles = [
        {
            title: "5 Common Mistakes to Avoid in Your Grant Proposal",
            description: "Learn how to sidestep the common pitfalls that get many grant applications rejected. From budget errors to a weak narrative, we cover what not to do.",
            category: "Proposal Writing",
        },
        {
            title: "How to Write a Compelling 'Statement of Need'",
            description: "The Statement of Need is the heart of your proposal. This guide provides a step-by-step process for crafting a data-driven, persuasive narrative.",
            category: "Grant Writing 101",
        },
        {
            title: "Finding the Right Grants: A Guide for Non-Profits",
            description: "Don't waste time on misaligned opportunities. Learn the strategies and tools to identify the grant funders that are a perfect match for your mission.",
            category: "Grant Discovery",
        },
         {
            title: "Decoding the Budget Narrative",
            description: "A strong budget narrative justifies your costs and builds trust with funders. We break down how to connect your expenses directly to your project activities.",
            category: "Financials",
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* FIX: Removed unsupported `isPublic` prop. */}
            <Header user={null} onLogout={() => {}} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-12">
                    <BookOpen size={40} className="mx-auto text-primary mb-4" />
                    <h1 className="text-4xl font-bold text-gray-800">Resource Center</h1>
                    <p className="text-lg text-gray-600 mt-2">Your guide to mastering the grant application process.</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="space-y-6">
                        {articles.map((article, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
                                <p className="text-sm font-semibold text-primary mb-1">{article.category}</p>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">{article.title}</h2>
                                <p className="text-gray-600">{article.description}</p>
                                <div className="mt-4 text-sm font-semibold text-primary hover:underline">
                                    Read more &rarr;
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ResourceCenter;