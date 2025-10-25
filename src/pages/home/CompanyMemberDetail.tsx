import React from 'react';
import { Mail, Phone, Calendar, MessageSquare, Edit, Folder, Star, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Productivity', value: 75 },
  { name: 'Communication', value: 60 },
  { name: 'Teamwork', value: 85 },
  { name: 'Problem Solving', value: 65 },
];

export default function CompanyMemberDetail() {
  return (
    <div className="p-8 bg-white-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Member Detail</h1>

      {/* Tabs */}
      <div className="flex space-x-6 border-b mb-6">
        {['Profile', 'Permissions', 'Reports', 'Feedback'].map((tab) => (
          <button
            key={tab}
            className={`pb-3 font-medium ${
              tab === 'Profile'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white text-3xl font-bold shadow">
              QJ
            </div>
            <div>
              <h2 className="text-xl font-semibold">Quincy Jefferson</h2>
              <p className="text-gray-500 text-sm">Product Manager</p>
            </div>

            <div className="text-sm space-y-2 text-gray-600 mt-2">
              <p className="flex items-center gap-2 justify-center">
                <Mail size={16} /> quincy@techcomp.com
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Phone size={16} /> 987-654-3210
              </p>
              <p className="flex items-center gap-2 justify-center">
                <Calendar size={16} /> Joined on Aug 1, 2023
              </p>
            </div>

            <div className="flex gap-3 w-full mt-4">
              <button className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm font-medium">
                <MessageSquare size={16} /> Message
              </button>
              <button className="flex-1 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm font-medium">
                <Edit size={16} /> Edit Info
              </button>
            </div>

            <div className="flex justify-around w-full py-4 mt-3 border-t border-gray-100">
              <div className="flex flex-col items-center">
                <Folder size={20} className="text-blue-500 mb-1" />
                <span className="text-sm font-semibold">8</span>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="flex flex-col items-center">
                <Star size={20} className="text-yellow-500 mb-1" />
                <span className="text-sm font-semibold">88</span>
                <p className="text-xs text-gray-500">Score</p>
              </div>
              <div className="flex flex-col items-center">
                <Clock size={20} className="text-purple-500 mb-1" />
                <span className="text-sm font-semibold">40</span>
                <p className="text-xs text-gray-500">hr/week</p>
              </div>
            </div>

            <button className="w-full py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">
              Back to Members List
            </button>
          </div>
        </div>
        {/* Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6"></div>

          {/* Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-lg font-semibold mb-4">Projects</h3>
            <div className="space-y-3">
              {[
                { name: 'Project Alpha', progress: 80 },
                { name: 'Project Beta', progress: 60 },
                { name: 'Project Gamma', progress: 45 },
              ].map((proj) => (
                <div key={proj.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{proj.name}</span>
                    <span className="text-gray-500">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-400 h-2.5 rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-sm transition">
              View All Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
