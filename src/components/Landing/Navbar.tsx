import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import UserMenu from '../UserMenu/UserMenu';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">FUSION</div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {['Features', 'Workflows', 'Notifications', 'Reports', 'FAQ', 'Company'].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Company') {
                        navigate('/company');
                      } else {
                        scrollToSection(item.toLowerCase());
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user?.token ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate('/register')}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Create account
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {['Features', 'Workflows', 'Notifications', 'Reports', 'FAQ', 'Company'].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Company') {
                        navigate('/company');
                      } else {
                        scrollToSection(item.toLowerCase());
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 text-base font-medium transition-colors duration-200"
                  >
                    {item}
                  </button>
                ),
              )}

              <div className="hidden md:flex items-center space-x-4">
                {user?.token ? (
                  <UserMenu />
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                    >
                      Create account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
