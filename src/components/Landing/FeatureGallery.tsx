import React, { useEffect, useRef, useState } from 'react';
import { 
  Shield, 
  Users, 
  Bell, 
  Settings, 
  BarChart3, 
  GitBranch,
  Eye,
  Lock,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  mockup: React.ReactNode;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, mockup, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        {mockup}
      </div>
    </div>
  );
};

const LoginMockup = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
        step >= 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}>
        <div className="text-xs font-medium text-gray-700">1. Email/Google SSO</div>
      </div>
      <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
        step >= 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
      }`}>
        <div className="text-xs font-medium text-gray-700">2. Session created</div>
      </div>
      <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${
        step >= 2 ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
      }`}>
        <div className="text-xs font-medium text-gray-700">3. Roles loaded</div>
        {step >= 2 && (
          <div className="mt-2 text-xs text-purple-700">
            <div className="flex items-center gap-1">
              <Shield size={12} />
              System Admin Access
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompanySwitchMockup = () => {
  const [activeCompany, setActiveCompany] = useState(0);
  const companies = ['TechCorp', 'StartupXYZ', 'Enterprise'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCompany(prev => (prev + 1) % companies.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      {companies.map((company, index) => (
        <div key={company} className={`p-2 rounded-lg transition-all duration-300 ${
          index === activeCompany ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
        }`}>
          <div className="text-xs font-medium">{company}</div>
          {index === activeCompany && (
            <div className="text-xs text-blue-600 mt-1">
              Permissions & data updated
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const NotificationsMockup = () => {
  const [count, setCount] = useState(5);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev > 0 ? prev - 1 : 5);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-red-600" />
          <span className="text-xs font-medium">Unread</span>
        </div>
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          {count}
        </span>
      </div>
      <div className="space-y-1">
        <div className="p-2 bg-gray-50 rounded text-xs">Project approved</div>
        <div className="p-2 bg-gray-50 rounded text-xs">New task assigned</div>
        <div className="p-2 bg-blue-50 rounded text-xs border border-blue-200">
          Mark as read → Count: {count - 1}
        </div>
      </div>
    </div>
  );
};

const RoleMatrixMockup = () => {
  const [activeRole, setActiveRole] = useState(0);
  const roles = ['Owner', 'Admin', 'PM', 'Dev', 'Viewer'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRole(prev => (prev + 1) % roles.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="font-medium">Role</div>
        <div className="font-medium">Create</div>
        <div className="font-medium">Edit</div>
      </div>
      {roles.map((role, index) => (
        <div key={role} className={`grid grid-cols-3 gap-1 p-1 rounded transition-all duration-300 ${
          index === activeRole ? 'bg-blue-100' : 'bg-gray-50'
        }`}>
          <div className="text-xs font-medium">{role}</div>
          <div className="text-xs">
            {index <= 2 ? <CheckCircle size={12} className="text-green-600" /> : <Eye size={12} className="text-gray-400" />}
          </div>
          <div className="text-xs">
            {index <= 1 ? <CheckCircle size={12} className="text-green-600" /> : <Lock size={12} className="text-gray-400" />}
          </div>
        </div>
      ))}
    </div>
  );
};

const KanbanMockup = () => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDraggedTask('Task #123');
      setTimeout(() => setDraggedTask(null), 1000);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {['To Do', 'In Progress', 'Done'].map((status, index) => (
        <div key={status} className={`p-2 rounded-lg border-2 transition-all duration-300 ${
          draggedTask && index === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="font-medium mb-2">{status}</div>
          <div className="space-y-1">
            {index === 0 && !draggedTask && (
              <div className="p-2 bg-white rounded border animate-pulse">Task #123</div>
            )}
            {index === 1 && draggedTask && (
              <div className="p-2 bg-blue-100 rounded border-2 border-blue-500 animate-bounce">
                {draggedTask}
              </div>
            )}
            {index === 1 && !draggedTask && (
              <div className="p-2 bg-white rounded border">Task #456</div>
            )}
            {index === 2 && (
              <div className="p-2 bg-green-100 rounded border">Task #789</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const TicketsMockup = () => {
  const [status, setStatus] = useState(0);
  const statuses = [
    { name: 'New', color: 'blue', icon: <AlertCircle size={12} /> },
    { name: 'In Progress', color: 'yellow', icon: <Clock size={12} /> },
    { name: 'Resolved', color: 'green', icon: <CheckCircle size={12} /> }
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => (prev + 1) % statuses.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const currentStatus = statuses[status];

  return (
    <div className="space-y-2">
      <div className="p-2 bg-gray-50 rounded-lg border">
        <div className="text-xs font-medium mb-1">Ticket #1234</div>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-500 ${
          currentStatus.color === 'blue' ? 'bg-blue-100 text-blue-700' :
          currentStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {currentStatus.icon}
          {currentStatus.name}
        </div>
      </div>
      <div className="flex gap-1">
        <div className="p-1 bg-orange-100 text-orange-700 rounded text-xs">SLA: 4h</div>
        <div className="p-1 bg-purple-100 text-purple-700 rounded text-xs">Public</div>
      </div>
    </div>
  );
};

const FeatureGallery = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything you need to <span className="text-blue-600">scale operations</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From authentication to advanced workflows, FUSION provides the complete toolkit for modern organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Shield size={20} />}
            title="Login & Role Loading"
            description="Email/Google SSO with instant role-based permissions"
            mockup={<LoginMockup />}
            delay={0}
          />
          
          <FeatureCard
            icon={<Users size={20} />}
            title="Company Context Switch"
            description="Switch between companies with real-time data updates"
            mockup={<CompanySwitchMockup />}
            delay={120}
          />
          
          <FeatureCard
            icon={<Bell size={20} />}
            title="In-App Notifications"
            description="Smart badge system with read/unread tracking"
            mockup={<NotificationsMockup />}
            delay={240}
          />
          
          <FeatureCard
            icon={<Settings size={20} />}
            title="Role & Permission Matrix"
            description="Granular access control at function-in-page level"
            mockup={<RoleMatrixMockup />}
            delay={360}
          />
          
          <FeatureCard
            icon={<GitBranch size={20} />}
            title="Workflow-Driven Tasks"
            description="Drag between valid statuses with transition guards"
            mockup={<KanbanMockup />}
            delay={480}
          />
          
          <FeatureCard
            icon={<BarChart3 size={20} />}
            title="Tickets with SLA Tracking"
            description="Public/internal threads with status progression"
            mockup={<TicketsMockup />}
            delay={600}
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureGallery;