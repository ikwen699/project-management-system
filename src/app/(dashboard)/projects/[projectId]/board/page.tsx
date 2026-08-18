"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Clock } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskDeadline } from "@/components/tasks/TaskDeadline";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  position: number;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  timeSpent: number | null;
}

interface Column {
  id: string;
  name: string;
  position: number;
  tasks: Task[];
}

interface Member {
  userId: string;
  userName: string;
}

export default function BoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [columns, setColumns] = useState<Column[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formColumnId, setFormColumnId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    const [cols, mems] = await Promise.all([
      fetch(`/api/projects/${projectId}/columns`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/members`).then((r) => r.json()),
    ]);
    setColumns(cols);
    setMembers(mems);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreateTask(columnId: string) {
    setFormColumnId(columnId);
    setShowTaskForm(true);
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newColumns = [...columns];
    const sourceCol = newColumns.find((c) => c.id === source.droppableId);
    const destCol = newColumns.find((c) => c.id === destination.droppableId);

    if (!sourceCol || !destCol) return;

    const sourceTasks = [...sourceCol.tasks];
    const destTasks = sourceCol.id === destCol.id ? sourceTasks : [...destCol.tasks];

    const [movedTask] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, movedTask);

    sourceCol.tasks = sourceTasks;
    if (sourceCol.id !== destCol.id) {
      destCol.tasks = destTasks;
    }

    setColumns(newColumns);

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: destination.droppableId,
        }),
      });
    } catch {
      toast.error("Failed to move task");
      loadData();
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Project
          </Link>
          <h1 className="text-2xl font-bold">Board</h1>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-h-[500px] pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-72 bg-muted/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{column.name}</h3>
                  <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                      }`}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-white rounded-lg p-3 border border-border border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                snapshot.isDragging ? "shadow-lg rotate-1" : ""
                              } ${
                                task.priority === "URGENT"
                                  ? "border-l-red-500"
                                  : task.priority === "HIGH"
                                  ? "border-l-orange-500"
                                  : task.priority === "MEDIUM"
                                  ? "border-l-blue-500"
                                  : "border-l-gray-400"
                              }`}
                            >
                              <p className="text-sm font-medium mb-2">{task.title}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TaskPriorityBadge priority={task.priority} />
                                  <TaskDeadline deadline={task.deadline} completedAt={task.completedAt} />
                                  {(task.timeSpent != null && task.timeSpent > 0) && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {task.timeSpent >= 60
                                        ? `${Math.floor(task.timeSpent / 60)}h`
                                        : `${task.timeSpent}m`}
                                    </span>
                                  )}
                                </div>
                                {task.assigneeName && (
                                  <div
                                    className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                                    title={task.assigneeName}
                                  >
                                    <span className="text-[10px] font-medium text-primary-foreground">
                                      {task.assigneeName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button
                  onClick={() => openCreateTask(column.id)}
                  className="w-full mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-white transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {showTaskForm && (
        <TaskForm
          projectId={projectId}
          columns={columns}
          members={members}
          initialColumnId={formColumnId}
          onClose={() => setShowTaskForm(false)}
          onSaved={loadData}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          columns={columns}
          members={members}
          onClose={() => setSelectedTask(null)}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}
    </div>
  );
}
