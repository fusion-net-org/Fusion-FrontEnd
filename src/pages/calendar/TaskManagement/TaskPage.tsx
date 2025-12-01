/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import { Button } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import TaskList from "./TaskList";
import TaskFormModal from "./TaskFormModal";
import { deleteTask, postTask, putTask } from "@/services/taskService.js";
import { ChevronDown, ChevronUp } from "lucide-react";
// ❌ BỎ TaskDetailModal cũ
// import TaskDetailModal from "./TaskDetailModal";
import TaskCalendarDetailModal from "@/components/Calendar/TaskCalendarDetailModal";
import type { Task } from "@/interfaces/Task/task";

const TaskPage: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // === State cho modal chi tiết kiểu Calendar ===
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailInitialTask, setDetailInitialTask] =
    useState<any | null>(null);

  const [sortColumn, setSortColumn] = useState("DueDate");
  const [sortDescending, setSortDescending] = useState(false);

  const handleSortChange = (value: string) => {
    setSortColumn(value);
  };

  const toggleSortOrder = () => {
    setSortDescending((prev) => !prev);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setOpenModal(true);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setOpenModal(true);
  };

  const handleDelete = async (taskId: string | number) => {
    try {
      const res = await deleteTask(String(taskId));
      if (res?.succeeded) {
        toast.success("Task deleted successfully!");
        setRefreshKey((k) => k + 1);
      } else {
        toast.error("Failed to delete task.");
      }
    } catch {
      toast.error("An error occurred while deleting the task.");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTask) {
        await putTask(editingTask.id || editingTask.taskId, values);
        toast.success("Task updated successfully!");
      } else {
        await postTask(values);
        toast.success("Task created successfully!");
      }
      setOpenModal(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("An error occurred while saving the task.");
    }
  };

  // === Khi click vào tên task trong list => mở modal chi tiết mới ===
  const handleOpenDetail = (task: Task) => {
    const anyTask: any = task;
    const id = anyTask.id ?? anyTask.taskId;

    setDetailTaskId(String(id));

    // Map tạm sang shape TaskCalendarItem cho modal
    setDetailInitialTask({
      id: String(id),
      taskId: String(id),
      code: anyTask.code,
      title: anyTask.title,
      description: anyTask.description ?? null,

      type: anyTask.type ?? null,
      priority: anyTask.priority ?? null,
      severity: anyTask.severity ?? null,
      status: anyTask.status ?? null,

      point: anyTask.point ?? null,
      estimateHours: anyTask.estimateHours ?? null,
      remainingHours: anyTask.remainingHours ?? null,

      createAt: anyTask.createAt ?? anyTask.createdAt ?? null,
      startDate: anyTask.startDate ?? null,
      endDate: anyTask.endDate ?? null,
      dueDate: anyTask.dueDate ?? null,

      createByName: anyTask.createByName ?? null,

      project: anyTask.project ?? null,
      sprint: anyTask.sprint ?? null,
      workflowStatus: anyTask.workflowStatus ?? null,
      members: anyTask.members ?? [],

      // Cho đẹp pill bên modal
      workflowStatusOptions:
        anyTask.workflowAssignments?.items?.map((x: any) => ({
          id: x.workflowStatusId,
          name: x.statusName,
          isEnd: false,
        })) ?? undefined,
    });

    setDetailOpen(true);
  };

  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-gray-600">
      {/* Header trên cùng: title + sort, giữ lại cho tiện, dưới là list style mới */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-lg font-semibold text-gray-700">My tasks</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              value={sortColumn}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="DueDate">Due date</option>
              <option value="Title">Title</option>
              <option value="CreateAt">Created at</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <Button
            size="small"
            onClick={toggleSortOrder}
            className="!flex !items-center !justify-center !w-9 !h-9 !border-gray-300 hover:!border-gray-400 hover:!bg-gray-50 rounded-lg"
          >
            {sortDescending ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>

          <Button type="primary" onClick={handleAdd}>
            New task
          </Button>
        </div>
      </div>

      {/* LIST – dùng design ProjectTaskList, dữ liệu từ /tasks/user */}
      <TaskList
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleOpenDetail} // ⬅ bấm vào tên sẽ gọi thằng này
        sortColumn={sortColumn}
        sortDescending={sortDescending}
        onAddClick={handleAdd}
      />

      {/* Modal chi tiết kiểu Calendar – read only + đổi status + open full page */}
      <TaskCalendarDetailModal
        open={detailOpen}
        taskId={detailTaskId}
        initialTask={detailInitialTask}
        onClose={() => {
          setDetailOpen(false);
          setDetailTaskId(null);
          setDetailInitialTask(null);
        }}
        onStatusChanged={async () => {
          // reload lại list khi đổi status
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Modal create / edit */}
      <TaskFormModal
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        task={editingTask}
      />
    </div>
  );
};

export default TaskPage;
