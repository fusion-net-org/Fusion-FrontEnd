/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import SprintCharts from './SprintCharts';
import { getSprintByProjectId } from '@/services/sprintService.js';
import { GetTaskBySprintId } from '@/services/taskService.js';
import type { ISprint } from '@/interfaces/Sprint/sprint';
import { useParams } from 'react-router-dom';
import type { ITask } from '@/interfaces/Task/task';
import { getUserById } from '@/services/userService.js';
import { DatePicker, Input, Select } from 'antd';
import { useDebounce } from '@/hook/Debounce';
import { Paging } from '@/components/Paging/Paging'; // import Paging

const { RangePicker } = DatePicker;
const { Option } = Select;

const SprintTab: React.FC = () => {
  const { projectId } = useParams();
  const [sprints, setSprints] = useState<ISprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<ISprint | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateRange, setDateRange] = useState<any | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  // Paging state
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
  });

  useEffect(() => {
    const fetchSprints = async () => {
      if (!projectId) return;
      try {
        const response = await getSprintByProjectId(projectId);
        setSprints(response.data.items);
      } catch (error) {
        console.error('Failed to fetch sprints:', error);
      }
    };
    fetchSprints();
  }, [projectId]);

  const handleSelectSprint = async (sprint: ISprint) => {
    setSelectedSprint(sprint);
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
    await fetchTasks(sprint.id, 1, pagination.pageSize);
  };

  const fetchTasks = async (
    sprintId: string,
    pageNumber: number = pagination.pageNumber,
    pageSize: number = pagination.pageSize,
  ) => {
    try {
      const response = await GetTaskBySprintId(
        sprintId,
        debouncedSearch,
        statusFilter === 'All' ? '' : statusFilter,
        priorityFilter === 'All' ? '' : priorityFilter,
        dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : '',
        dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : '',
        pageNumber,
        pageSize,
        '',
        null,
      );

      const tasksData = response.data.items;
      setTasks(tasksData);

      const namesMap: Record<string, string[]> = {};
      await Promise.all(
        tasksData.map(async (task: ITask) => {
          const names = await Promise.all(
            task.assigneeIds.map(async (userId: string) => {
              try {
                const userResponse = await getUserById(userId);
                return userResponse.data.userName;
              } catch {
                return 'Unknown';
              }
            }),
          );
          namesMap[task.id] = names;
        }),
      );
      setAssigneeNames(namesMap);

      // Update total count for paging
      setPagination((prev) => ({
        ...prev,
        totalCount: response.data.totalCount || 0,
      }));
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
  };

  useEffect(() => {
    if (selectedSprint) {
      setPagination((prev) => ({ ...prev, pageNumber: 1 }));
      fetchTasks(selectedSprint.id, 1, pagination.pageSize);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, dateRange]);

  return (
    <div className="space-y-6">
      <SprintCharts projectId={projectId!} />

      {/* Sprint Selector */}
      <h2 className="text-lg font-semibold text-gray-700 mb-2">Select a Sprint</h2>
      <div className="w-64">
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-[-20px]"
          value={selectedSprint?.id || ''}
          onChange={(e) => {
            const sprint = sprints.find((s) => s.id === e.target.value);
            if (sprint) handleSelectSprint(sprint);
          }}
        >
          <option value="" disabled>
            -- Choose Sprint --
          </option>
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-gray-700 text-sm mb-1">Search Title Task</label>
          <Input
            placeholder="Search Title Task..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col min-w-[220px]">
          <label className="text-gray-700 text-sm mb-1">Date Range</label>
          <RangePicker
            className="w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(dates) => setDateRange(dates)}
          />
        </div>

        <div className="flex flex-col min-w-[140px]">
          <label className="text-gray-700 text-sm mb-1">Status</label>
          <Select defaultValue="All" className="w-full" onChange={(v) => setStatusFilter(v)}>
            <Option value="All">All</Option>
            <Option value="Done">Done</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="Review">Review</Option>
          </Select>
        </div>

        <div className="flex flex-col min-w-[140px]">
          <label className="text-gray-700 text-sm mb-1">Priority</label>
          <Select defaultValue="All" className="w-full" onChange={(v) => setPriorityFilter(v)}>
            <Option value="All">All</Option>
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      {selectedSprint && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Priority</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Assignees</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Created At</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">
                    Meet Deadline
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Deleted</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-3 text-gray-700">{task.title}</td>
                    <td className="px-6 py-3 text-gray-600">{task.type}</td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          task.priority === 'High'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {assigneeNames[task.id]?.length ? assigneeNames[task.id].join(', ') : 'None'}
                    </td>

                    <td className="px-6 py-3 text-center text-gray-500">
                      {new Date(task.createAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          task.status !== 'Done' && new Date(task.dueDate) < new Date()
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.status !== 'Done' && new Date(task.dueDate) < new Date()
                          ? 'No'
                          : 'Yes'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          task.isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {task.isDeleted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'Done'
                            ? 'bg-green-100 text-green-700'
                            : task.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : task.status === 'Review'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          <div className="mt-4">
            <Paging
              page={pagination.pageNumber}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, pageNumber: page }))}
              onPageSizeChange={(size) =>
                setPagination((prev) => ({ ...prev, pageSize: size, pageNumber: 1 }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintTab;
