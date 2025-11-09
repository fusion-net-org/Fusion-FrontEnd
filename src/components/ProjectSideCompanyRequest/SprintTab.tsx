// SprintTab.tsx
import React, { useState } from 'react';
import SprintCharts from './SprintCharts';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: string;
}

interface SprintTabProps {
  tasksPerSprint: Record<string, Task[]>;
  sprintData: { name: string; total: number; done: number }[];
}

const SprintTab: React.FC<SprintTabProps> = ({ tasksPerSprint, sprintData }) => {
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Sprint Charts */}
      <SprintCharts sprintData={sprintData} />
      {/* Sprint Selector */}
      <h2 className="text-lg font-semibold text-gray-700">Select a Sprint</h2>
      <div className="flex gap-3 flex-wrap">
        {Object.keys(tasksPerSprint).map((sprint) => (
          <button
            key={sprint}
            onClick={() => setSelectedSprint(sprint)}
            className={`px-4 py-2 rounded-xl font-medium border transition
              ${
                selectedSprint === sprint
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {sprint}
          </button>
        ))}
      </div>

      {/* Sprint Tasks Table */}
      {selectedSprint && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{selectedSprint} Tasks</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(tasksPerSprint[selectedSprint] || []).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-800">{t.id}</td>
                    <td className="px-6 py-3 text-gray-700">{t.title}</td>
                    <td className="px-6 py-3 text-gray-600">{t.assignee}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          t.status === 'Done'
                            ? 'bg-green-100 text-green-700'
                            : t.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : t.status === 'In Review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintTab;
