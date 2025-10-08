import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Lock, 
  Users, 
  Key, 
  Building2, 
  UserCheck,
  Database,
  Globe
} from 'lucide-react';

const SecurityArchitecture = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const layers = [
    {
      name: 'Multi-Company Isolation',
      icon: <Building2 size={16} />,
      description: 'Complete data separation between companies',
      details: 'Each company operates in an isolated environment with zero cross-contamination'
    },
    {
      name: 'Role-Based Access Control',
      icon: <UserCheck size={16} />,
      description: 'Granular permissions at function level',
      details: 'Users → CompanyMembers → Roles → UserRoles → RolePermissions → FunctionInPages'
    },
    {
      name: 'System Admin Scope',
      icon: <Key size={16} />,
      description: 'Global oversight and management',
      details: 'System administrators can access all companies while maintaining audit trails'
    },
    {
      name: 'Data Encryption',
      icon: <Lock size={16} />,
      description: 'End-to-end data protection',
      details: 'All data encrypted in transit and at rest with enterprise-grade security'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer(prev => (prev + 1) % layers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} className="text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-900">Security Architecture</h3>
      </div>

      <div className="space-y-6">
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-all duration-500 ${
              index === activeLayer
                ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                index === activeLayer ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {layer.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${
                  index === activeLayer ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {layer.name}
                </h4>
                <p className={`text-sm mb-2 ${
                  index === activeLayer ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {layer.description}
                </p>
                {index === activeLayer && (
                  <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded animate-fadeIn">
                    {layer.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Database size={16} className="text-green-600" />
          <span className="font-medium text-green-900">Compliance Ready</span>
        </div>
        <p className="text-sm text-green-700">
          SOC 2 Type II, GDPR compliant, and enterprise security standards
        </p>
      </div>
    </div>
  );
};

const RBACVisualization = () => {
  const [currentPath, setCurrentPath] = useState(0);
  const pathElements = [
    { name: 'User', icon: <Users size={14} />, active: false },
    { name: 'Company Member', icon: <Building2 size={14} />, active: false },
    { name: 'Role Assignment', icon: <UserCheck size={14} />, active: false },
    { name: 'Permissions', icon: <Key size={14} />, active: false },
    { name: 'Function Access', icon: <Globe size={14} />, active: false }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPath(prev => (prev + 1) % pathElements.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <Lock size={24} className="text-purple-600" />
        <h3 className="text-2xl font-bold text-gray-900">RBAC Flow</h3>
      </div>

      <div className="space-y-4">
        {pathElements.map((element, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-500 ${
              index <= currentPath
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}>
              {element.icon}
              <span className="font-medium">{element.name}</span>
            </div>
            {index < pathElements.length - 1 && (
              <div className={`w-8 h-0.5 transition-colors duration-500 ${
                index < currentPath ? 'bg-purple-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-900 mb-1">Permission Types</div>
          <div className="text-xs text-purple-700">
            <div>• Page-level access</div>
            <div>• Function-specific rights</div>
            <div>• Data visibility rules</div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-1">Role Hierarchy</div>
          <div className="text-xs text-blue-700">
            <div>• Owner → Full Control</div>
            <div>• Admin → Management</div>
            <div>• User → Limited Access</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SecuritySection = () => {
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

    const element = document.getElementById('security-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="security-section" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Enterprise-grade <span className="text-blue-400">security</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Multi-layered security architecture designed for the most demanding enterprise requirements.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 gap-12 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <SecurityArchitecture />
          <RBACVisualization />
        </div>

        <div className={`mt-16 text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <Shield size={20} className="text-green-400" />
            <span className="text-white font-medium">
              Trusted by enterprise customers worldwide
            </span>
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;