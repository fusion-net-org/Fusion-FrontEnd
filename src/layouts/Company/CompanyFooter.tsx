import React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';
import logo from '@/assets/logo_fusion.png';

export default function CompanyFooter() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row justify-around items-center text-gray-600">
        <div className="flex items-center space-x-3">
          <img
            src={logo}
            alt="Fusion Logo"
            className="w-8 h-8 rounded-full shadow-sm hover:scale-105 transition-transform duration-200"
          />
          <p className="text-sm font-medium tracking-wide">
            © {new Date().getFullYear()} <span className="font-semibold text-gray-800">Fusion</span>{' '}
            — Company Console
          </p>
        </div>

        <div className="flex items-center space-x-6 mt-4 sm:mt-0">
          {['Privacy', 'Terms', 'Support'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              {item}
            </a>
          ))}
          <div className="flex space-x-4 ml-2">
            <a
              href="#"
              className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
            >
              <Github size={18} />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-700 transition-colors duration-200"
            >
              <Linkedin size={18} />
            </a>
            <a href="#" className="text-gray-500 hover:text-sky-500 transition-colors duration-200">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
