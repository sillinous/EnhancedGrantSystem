
import React, { useState, useEffect } from 'react';
import { MonetizationModel, AppConfig, SourcingAgent } from '../types';
import * as configService from '../services/configService';
import * as sourcingService from '../services/sourcingService';
import { DollarSign, BarChart2, Users, Settings, Cpu, Globe } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [agents, setAgents] = useState<SourcingAgent[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setConfig(configService.getConfig());
    setAgents(sourcingService.getAgents());
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as MonetizationModel;
    configService.setMonetizationModel(newModel);
    setConfig(configService.getConfig());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const Card: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode; className?: string}> = ({title, icon, children, className}) => (
      <div className={`bg-white p-6 rounded-xl shadow-md border border-gray-200 ${className}`}>
          <div className="flex items-center text-primary mb-3">
              {icon}
              <h3 className="text-lg font-bold ml-2">{title}</h3>
          </div>
          {children}
      </div>
  )

  return (
    <div className="animate-fade-in space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="App Configuration" icon={<Settings size={24} />} className="lg:col-span-1">
          <div className="space-y-2">
            <label htmlFor="monetization-model" className="block text-sm font-medium text-gray-700">Monetization Model</label>
            <select
              id="monetization-model"
              value={config.monetizationModel}
              onChange={handleModelChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="Free">Free</option>
              <option value="Subscription">Subscription</option>
              <option value="PayPerFeature">Pay-Per-Feature</option>
              <option value="UsageBased">Usage-Based</option>
            </select>
             {showSuccess && <p className="text-sm text-green-600 mt-2 animate-fade-in">Settings saved successfully!</p>}
             <div className="text-xs text-gray-500 pt-2 space-y-1">
                <p><strong>Free:</strong> All features are unlocked for all users.</p>
                <p><strong>Subscription:</strong> Locks premium features for non-subscribed users.</p>
                <p><strong>Pay-Per-Feature:</strong> Allows users to purchase individual features.</p>
                <p><strong>Usage-Based:</strong> Grants a limited number of free uses for premium features per month.</p>
            </div>
          </div>
        </Card>
        
        <Card title="AI Sourcing Network" icon={<Cpu size={24} />} className="lg:col-span-2">
            <p className="text-gray-600 text-sm mb-3">Simulated AI agents continuously scanning for new global grant opportunities.</p>
             <ul className="space-y-2">
                {agents.map(agent => (
                    <li key={agent.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                            <Globe size={20} className="text-gray-400 mr-3" />
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{agent.name}</p>
                                <p className="text-xs text-gray-500">{agent.sector}</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            {agent.status}
                        </span>
                    </li>
                ))}
             </ul>
        </Card>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="User Engagement" icon={<Users size={24} />}>
                <p className="text-gray-600 text-sm">Placeholder for user activity metrics.</p>
                <div className="h-32 bg-gray-100 mt-2 rounded-md flex items-center justify-center text-gray-400">Chart Area</div>
            </Card>

            <Card title="Feature Adoption" icon={<BarChart2 size={24} />}>
                 <p className="text-gray-600 text-sm">Placeholder for feature usage analytics.</p>
                 <div className="h-32 bg-gray-100 mt-2 rounded-md flex items-center justify-center text-gray-400">Chart Area</div>
            </Card>
       </div>
    </div>
  );
};

export default AdminDashboard;