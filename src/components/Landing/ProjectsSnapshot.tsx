import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus
} from 'lucide-react';

const BurndownChart = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev + 1) % 101);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const points = [];
  for (let i = 0; i <= 10; i++) {
    const ideal = 100 - (i * 10);
    const actual = Math.max(0, 100 - (i * 8) - Math.sin(i * 0.5) * 10);
    points.push({ x: i * 30, ideal, actual });
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-blue-600" />
        <span className="text-sm font-medium">Sprint Burndown</span>
      </div>
      <div className="relative h-32">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="burndownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={128 - (y * 1.28)}
              x2="300"
              y2={128 - (y * 1.28)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Ideal line */}
          <line
            x1="0"
            y1="0"
            x2="300"
            y2="128"
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          
          {/* Actual progress line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            points={points.map(p => `${p.x},${128 - (p.actual * 1.28)}`).join(' ')}
          />
          
          {/* Progress indicator */}
          <circle
            cx={progress * 3}
            cy={128 - (Math.max(0, 100 - (progress * 0.8) - Math.sin(progress * 0.05) * 10) * 1.28)}
            r="4"
            fill="#3B82F6"
            className="animate-pulse"
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Day 0</span>
        <span>Current: {Math.round(100 - progress)}pts</span>
        <span>Day 10</span>
      </div>
    </div>
  );
};

const SprintCard = () => {
  const [daysLeft, setDaysLeft] = useState(7);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDaysLeft(prev => prev === 0 ? 14 : prev - 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span className="font-medium">Sprint 23</span>
        </div>
        <div className="text-xs bg-white/20 px-2 py-1 rounded">
          {daysLeft} days left
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs opacity-90">Progress</div>
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-1000"
            style={{ width: `${((14 - daysLeft) / 14) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-90">
          <span>{14 - daysLeft}/14 days</span>
          <span>{Math.round(((14 - daysLeft) / 14) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

const TeamMemberInvite = () => {
  const [inviteStep, setInviteStep] = useState(0);
  const steps = ['Select Members', 'Send Invites', 'Confirm'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setInviteStep(prev => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={16} className="text-green-600" />
        <span className="text-sm font-medium">Team Invitations</span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div 
            key={step}
            className={`flex items-center gap-2 p-2 rounded transition-all duration-300 ${
              index === inviteStep ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              index === inviteStep ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className={`text-sm ${
              index === inviteStep ? 'text-green-900 font-medium' : 'text-gray-600'
            }`}>
              {step}
            </span>
            {index === inviteStep && (
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Internal + Partner members supported
      </div>
    </div>
  );
};

const StatusTiles = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const metrics = [
    { label: 'Active', value: 24, color: 'blue', icon: <Clock size={16} /> },
    { label: 'Completed', value: 89, color: 'green', icon: <CheckCircle size={16} /> },
    { label: 'Blocked', value: 3, color: 'red', icon: <AlertCircle size={16} /> },
    { label: 'Review', value: 7, color: 'yellow', icon: <User size={16} /> }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric(prev => (prev + 1) % metrics.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric, index) => (
        <div 
          key={metric.label}
          className={`p-3 rounded-lg border transition-all duration-300 transform ${
            index === activeMetric 
              ? `bg-${metric.color}-50 border-${metric.color}-300 scale-105 shadow-lg` 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`${
              index === activeMetric 
                ? `text-${metric.color}-600` 
                : 'text-gray-400'
            }`}>
              {metric.icon}
            </div>
            <span className={`text-xs font-medium ${
              index === activeMetric 
                ? `text-${metric.color}-900` 
                : 'text-gray-600'
            }`}>
              {metric.label}
            </span>
          </div>
          <div className={`text-xl font-bold ${
            index === activeMetric 
              ? `text-${metric.color}-700` 
              : 'text-gray-500'
          }`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProjectsSnapshot = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('projects-snapshot');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="projects-snapshot" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Projects & <span className="text-blue-600">Sprint Management</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real-time insights into sprint progress, team collaboration, and project health metrics.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <SprintCard />
          <div className="space-y-6">
            <StatusTiles />
          </div>
          <BurndownChart />
          <TeamMemberInvite />
        </div>

        <div className={`mt-12 text-center transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700">
            <TrendingUp size={16} />
            <span className="text-sm font-medium">Data sourced from task completion and time tracking</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSnapshot;