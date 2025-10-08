import React, { useEffect, useRef, useState } from 'react';
import { Mail, Shield, Bell, ChevronDown, Check } from 'lucide-react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loginStep, setLoginStep] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState('TechCorp Inc.');
  const [notificationCount, setNotificationCount] = useState(3);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Simulate login flow
    const loginTimer = setTimeout(() => setLoginStep(1), 1000);
    const completeTimer = setTimeout(() => setLoginStep(2), 2000);
    
    return () => {
      clearTimeout(loginTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  const companies = ['TechCorp Inc.', 'StartupXYZ', 'Enterprise Solutions', 'Innovation Labs'];

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#E9F2FE] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-7xl font-bold text-gray-900 mb-6 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Unify your workflows.<br />
            <span className="text-blue-600">Accelerate delivery.</span>
          </h1>
          
          <p className={`text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Multi-company RBAC, workflow-driven projects, real-time notifications—on a clean, modern UI.
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Start free trial
            </button>
            <button className="border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105">
              Watch demo
            </button>
          </div>
        </div>

        {/* Hero Animation - Product Mockups */}
        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}>
          
          {/* Left Mockup - SSO Login */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign in to FUSION</h3>
                <p className="text-gray-600">Welcome back! Choose your sign-in method.</p>
              </div>
              
              <div className="space-y-4">
                <button className={`w-full flex items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all duration-300 ${
                  loginStep >= 1 ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-blue-500'
                }`}>
                  <Mail size={20} />
                  <span className="font-medium">Continue with Email</span>
                  {loginStep >= 1 && <Check size={20} className="text-green-600" />}
                </button>
                
                <button className={`w-full flex items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all duration-300 ${
                  loginStep >= 2 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-blue-500'
                }`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Continue with Google</span>
                  {loginStep >= 2 && <Check size={20} className="text-blue-600" />}
                </button>
              </div>

              {loginStep >= 2 && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700">
                    <Shield size={16} />
                    <span className="text-sm font-medium">Session created • Roles loaded</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Mockup - Company Switch & Notifications */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Dashboard</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Bell size={24} className="text-gray-600 hover:text-blue-600 cursor-pointer transition-colors" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Active Company</label>
                  <div className="relative">
                    <select 
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {companies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Active Projects</span>
                    <span className="text-2xl font-bold text-blue-600">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Pending Tasks</span>
                    <span className="text-2xl font-bold text-orange-500">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Team Members</span>
                    <span className="text-2xl font-bold text-green-600">156</span>
                  </div>
                </div>

                {notificationCount > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Bell size={16} className="text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">New project request</p>
                        <p className="text-xs text-blue-700 mt-1">Mobile App Redesign requires your approval</p>
                      </div>
                      <button
                        onClick={() => setNotificationCount(count => Math.max(0, count - 1))}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Mark read
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;