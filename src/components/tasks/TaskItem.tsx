import React from 'react';
import { Calendar, Flag, Bell, Repeat, Tag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    completed: boolean;
    description: string;
    dueDate?: string;
    time?: string;
    priority: string;
    reminder?: string;
    labels?: string[];
    repeat?: string;
  };
  draggedTaskId: string | null;
  dragOverTaskId: string | null;
  expandedLabelsTaskId: string | null;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent, taskId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onToggle: (taskId: string) => void;
  onToggleLabels: (taskId: string) => void;
  getLabelColor: (labelName: string) => string;
  getPriorityStyle: (priorityName: string) => { bg: string; text: string };
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  draggedTaskId,
  dragOverTaskId,
  expandedLabelsTaskId,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onToggle,
  onToggleLabels,
  getLabelColor,
  getPriorityStyle,
}) => {
  return (
    <div
      key={task.id}
      className={`rounded-[12px] p-4 bg-transparent hover:bg-[#1f1f1f] transition-all ${
        draggedTaskId === task.id ? 'opacity-50' : ''
      } ${
        dragOverTaskId === task.id ? 'border border-blue-500' : ''
      }`}
      onContextMenu={(e) => onContextMenu(e, task.id)}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, task.id)}
      onDragEnd={onDragEnd}
      style={{ cursor: draggedTaskId === task.id ? 'grabbing' : 'grab' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-4 h-4 border-2 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
            task.completed
              ? 'bg-white border-white'
              : 'border-gray-400 hover:border-gray-300'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
        />
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className={`text-base font-semibold flex-1 truncate ${
                task.completed ? 'text-gray-400 line-through' : 'text-white'
              }`}>
                {task.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
              <p className="max-w-sm">{task.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {task.description && (
        <div className="mb-3 ml-6">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-gray-300 cursor-help line-clamp-2">
                  {task.description}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
                <p className="max-w-sm">{task.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="ml-6 flex items-center gap-2 flex-wrap">
        {(task.dueDate || task.time) && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252527] border border-[#414141] rounded-full text-xs text-gray-300 cursor-help">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {task.dueDate && task.time ? `${task.dueDate} ${task.time}` : task.dueDate || task.time}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
                <p className="text-xs">
                  {task.dueDate && task.time ? `Due: ${task.dueDate} at ${task.time}` : `Due: ${task.dueDate || task.time}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {(() => {
          const style = getPriorityStyle(task.priority);
          return (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${style.bg} ${style.text} cursor-help`}>
                    <Flag className={`h-3 w-3 ${style.text}`} />
                    <span>{task.priority}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
                  <p className="text-xs">Priority: {task.priority}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })()}

        {task.reminder && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252527] border border-[#414141] rounded-full cursor-help">
                  <Bell className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-300">{task.reminder}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
                <p className="text-xs">Reminder: {task.reminder}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {task.repeat && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252527] border border-[#414141] rounded-full cursor-help">
                  <Repeat className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-300">Repeats</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border-0 z-50">
                <p className="text-xs">Repeats: {task.repeat.replace(/-/g, ' ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {task.labels && task.labels.length > 0 && (
          <div className="relative">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLabels(task.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252527] border border-[#414141] rounded-full hover:border-[#525252] transition-all duration-200 cursor-pointer w-fit"
                  >
                    {task.labels.map((label, index) => (
                      <Tag
                        key={index}
                        className={`h-4 w-4 ${getLabelColor(label)} transition-all duration-200`}
                      />
                    ))}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="bg-[#1f1f1f] text-white rounded-xl border border-[#414141] z-50 p-2">
                  <div className="flex flex-col gap-2">
                    {task.labels.map((label, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Tag className={`h-3 w-3 ${getLabelColor(label)}`} />
                        <span className="text-xs">{label}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {expandedLabelsTaskId === task.id && (
              <div className="absolute top-full mt-1 left-0 bg-[#1f1f1f] border border-[#414141] rounded-[12px] p-3 z-50 shadow-xl whitespace-nowrap">
                <div className="flex flex-col gap-2">
                  {task.labels.map((label, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Tag className={`h-4 w-4 ${getLabelColor(label)}`} />
                      <span className="text-xs text-white">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
