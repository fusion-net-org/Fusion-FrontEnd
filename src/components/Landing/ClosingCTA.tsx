import React, { useEffect, useState } from 'react';
import { ArrowRight, Play, Zap, Shield, Users, BarChart3 } from 'lucide-react';

const FeatureBadge = ({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

const ClosingCTA = () => {
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

    const element = document.getElementById('closing-cta');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="closing-cta" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className={`mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ lineHeight: '1.1' }}>
              Run your organization
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                on FUSION
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of teams already using FUSION to streamline operations, 
              enhance collaboration, and accelerate delivery.
            </p>
          </div>

          {/* Feature Badges */}
          <div className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <FeatureBadge icon={<Zap size={16} />} text="Instant Setup" delay={0} />
            <FeatureBadge icon={<Shield size={16} />} text="Enterprise Security" delay={200} />
            <FeatureBadge icon={<Users size={16} />} text="Multi-Company" delay={400} />
            <FeatureBadge icon={<BarChart3 size={16} />} text="Advanced Analytics" delay={600} />
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <button className="group bg-white text-blue-600 px-10 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center gap-3">
              <span>Start free trial</span>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button className="group border-2 border-white/30 hover:border-white/60 text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 backdrop-blur-sm bg-white/10 flex items-center gap-3">
              <Play size={24} className="group-hover:scale-110 transition-transform duration-200" />
              <span>Watch 5-min demo</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className={`transition-all duration-1000 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">50K+</div>
                <div className="text-blue-200 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">1K+</div>
                <div className="text-blue-200 text-sm">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                <div className="text-blue-200 text-sm">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-blue-200 text-sm">Support</div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-blue-200 text-sm">
                ✓ No credit card required  •  ✓ 14-day free trial  •  ✓ Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;