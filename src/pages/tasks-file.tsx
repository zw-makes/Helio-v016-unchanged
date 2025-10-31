import React, { useState } from 'react';
import TasksHeader from '@/components/tasks/TasksHeader';
import DateSelector from '@/components/tasks/DateSelector';
import PrioritySelector from '@/components/tasks/PrioritySelector';
import ReminderSelector from '@/components/tasks/ReminderSelector';
import LabelSelector from '@/components/tasks/LabelSelector';
import { Plus, CircleCheck as CheckCircle, ChevronRight, MoveVertical as MoreVertical, FileText, AlignLeft, Calendar, Flag, Bell, Tag, Link, Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  creationDate: string;
  dueDate: string;
  time: string;
  priority: string;
  description: string;
  reminder?: string;
  labels?: string[];
}

const Tasks = () => {
  const [currentView, setCurrentView] = useState('list');
  const [isRotated, setIsRotated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('kario-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('Priority 3');
  const [selectedReminder, setSelectedReminder] = useState<string | undefined>();
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;

  const getPriorityColorFromStorage = (priorityName: string) => {
    const saved = localStorage.getItem('kario-custom-priorities');
    if (saved) {
      const customPriorities = JSON.parse(saved);
      const found = customPriorities.find((p: { name: string; color: string }) => p.name === priorityName);
      if (found) {
        return found.color;
      }
    }
    return 'text-gray-400';
  };

  const getPriorityStyle = (priorityName: string) => {
    if (priorityName.startsWith('Priority ')) {
      const level = parseInt(priorityName.replace('Priority ', ''));
      const styles = {
        1: { bg: 'bg-red-500/20', text: 'text-red-400' },
        2: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
        3: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
        4: { bg: 'bg-green-500/20', text: 'text-green-400' },
        5: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
        6: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      };
      return styles[level as keyof typeof styles] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
    return { bg: 'bg-gray-500/20', text: getPriorityColorFromStorage(priorityName) };
  };

  const handleCreateTask = () => {
    setIsRotated(!isRotated);
    setIsAddingTask(true);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const currentDate = new Date();
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        creationDate: currentDate.toLocaleDateString(),
        dueDate: selectedDate ? selectedDate.toLocaleDateString() : new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        time: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: selectedPriority,
        description: newTaskDescription.trim(),
        reminder: selectedReminder,
        labels: selectedLabels
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      localStorage.setItem('kario-tasks', JSON.stringify(updatedTasks));
      setNewTaskTitle('');
      setNewTaskDescription('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedPriority('Priority 3');
      setSelectedReminder(undefined);
      setSelectedLabels([]);
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('kario-tasks', JSON.stringify(updatedTasks));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('kario-tasks', JSON.stringify(updatedTasks));
    setContextMenu(null);
  };

  const handleEditTask = (taskId: string) => {
    setContextMenu(null);
  };

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTaskId(taskId);
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, dropTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === dropTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const draggedIndex = tasks.findIndex(task => task.id === draggedTaskId);
    const dropIndex = tasks.findIndex(task => task.id === dropTaskId);

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    setTasks(newTasks);
    localStorage.setItem('kario-tasks', JSON.stringify(newTasks));
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#161618]">
      <TasksHeader
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        pendingTasks={pendingTasks}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onCreateTask={handleCreateTask}
        isRotated={isRotated}
      />
      
      {/* LIST View Content */}
      {currentView === 'list' && (
        <div className="px-4 mt-4">
          <div className="ml-20">
            
            {/* Case b & e: Tasks-By-Kairo Section */}
            <div className="max-w-[980px]">
              {/* Case f: Section heading with K icon that transforms to chevron on hover */}
              <div 
                className="flex items-center gap-2 mb-4 cursor-pointer group relative bg-[#1b1b1b] border border-[#525252] rounded-[20px]"
                style={{ padding: '0.80rem' }}
                onClick={() => setIsSectionExpanded(!isSectionExpanded)}
              >
                {/* K icon (visible by default) */}
                <span className={`h-5 w-5 flex items-center justify-center text-gray-400 font-orbitron font-bold text-xl group-hover:opacity-0 transition-all duration-200`}>
                  K
                </span>
                {/* Chevron icon (visible on hover) */}
                <ChevronRight 
                  className={`h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute ${
                    isSectionExpanded ? 'rotate-90' : 'rotate-0'
                  }`}
                />
                <h2 className="text-white text-xl font-semibold">Tasks Made By Kairo</h2>
                
                {/* Task count indicator - positioned right next to heading */}
                <div className="bg-[#242628] border border-[#414141] text-white font-orbitron font-bold px-3 py-1 rounded-[5px]">
                  {tasks.length}
                </div>

                {/* Three-dot menu icon (visible on hover) */}
                <MoreVertical 
                  className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-auto"
                />
              </div>
            </div>
            
            {/* Expandable content - positioned below the main section */}
            {isSectionExpanded && (
              <div className="bg-transparent max-w-[980px]" style={{ marginBottom: '45px' }}>
                {/* Table for tasks */}
                <div className="bg-transparent rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#414141] hover:bg-transparent bg-transparent">
                        <TableHead className="text-gray-400 font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Task Name
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-400 font-medium">
                          <div className="flex items-center gap-2">
                            <AlignLeft className="h-4 w-4" />
                            Description
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-400 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Creation Date
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-400 font-medium">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Priority
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-400 font-medium w-24">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Progress
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className={`border-b border-[#414141] hover:bg-[#313133] bg-transparent transition-all ${
                            draggedTaskId === task.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab hover:cursor-grab'
                          } ${
                            dragOverTaskId === task.id ? 'border-t-2 border-t-blue-500' : ''
                          }`}
                          onClick={() => handleToggleTask(task.id)}
                          onContextMenu={(e) => handleContextMenu(e, task.id)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragOver={(e) => handleDragOver(e, task.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, task.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <TableCell className={`${
                            task.completed ? 'text-gray-400 line-through' : 'text-white'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 border-2 rounded-full cursor-pointer transition-colors ${
                                  task.completed
                                    ? 'bg-white border-white'
                                    : 'border-gray-400 hover:border-gray-300'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(task.id);
                                }}
                              >
                              </div>
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate max-w-[150px]">{task.title}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-[#1f1f1f] text-white rounded-xl border-0">
                                    <p className="max-w-sm">{task.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[150px] block">{task.description || 'No description'}</span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-[#1f1f1f] text-white rounded-xl border-0">
                                  <p className="max-w-sm">{task.description || 'No description'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-white">{task.creationDate}</TableCell>
                          <TableCell>
                            {(() => {
                              const style = getPriorityStyle(task.priority);
                              return (
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${style.bg} ${style.text}`}>
                                  <Flag className={`h-3 w-3 ${style.text}`} />
                                  {task.priority}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center">
                                <CheckCircle 
                                  className={`h-4 w-4 transition-colors ${
                                    task.completed ? 'text-green-400' : 'text-gray-500'
                                  }`}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              
                {/* Add New Task Input */}
                {isAddingTask && (
                  <div className="p-4 bg-transparent border border-[#525252] rounded-[20px] min-h-[160px] relative z-10 overflow-visible mt-4">
                    {/* Section 1: Title */}
                    <div className="mb-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Task title"
                        className="w-full bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base font-semibold"
                        autoFocus
                      />
                    </div>

                    {/* Section 2: Description */}
                    <div className="mb-2">
                      <textarea
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Description"
                        className="w-full bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 p-0 resize-none min-h-[40px] outline-none text-sm"
                      />
                    </div>

                    {/* Separator Line */}
                    <div className="border-t border-[#414141] mb-4"></div>

                    {/* Section 3: Bottom Section with Action Buttons and Main Buttons */}
                    <div className="flex flex-wrap justify-between items-center gap-2 relative z-20">
                      {/* Action Buttons in Middle (with border) */}
                      <div className="border border-[#414141] rounded-[20px] p-2 flex flex-wrap gap-2 relative z-30 bg-[#1b1b1b]">
                        <DateSelector
                          selectedDate={selectedDate}
                          onSelect={setSelectedDate}
                          onTimeSelect={setSelectedTime}
                        />
                        <PrioritySelector
                          selectedPriority={selectedPriority}
                          onSelect={setSelectedPriority}
                        />
                        <ReminderSelector
                          selectedReminder={selectedReminder}
                          onSelect={setSelectedReminder}
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                        />
                        <LabelSelector
                          selectedLabels={selectedLabels}
                          onSelect={setSelectedLabels}
                        />
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:border hover:border-[#252232] hover:bg-[#1e1e1f] hover:rounded-[8px] px-3 py-1 h-8 whitespace-nowrap transition-all duration-200 border border-transparent">
                          <Link className="h-4 w-4 mr-2" />
                          Link
                        </Button>
                      </div>

                      {/* Main Action Buttons on Right */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => {
                            setIsAddingTask(false);
                            setNewTaskTitle('');
                            setNewTaskDescription('');
                          }}
                          variant="ghost"
                          size="sm"
                          className="border border-[#690707] rounded-[10px] bg-[#391e1e] text-[crimson] hover:bg-[#391e1e] hover:text-[crimson]"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="border border-[#5f5c74] bg-[#13132f] rounded-[10px] text-[#dedede] hover:bg-[#13132f] hover:text-[#dedede]"
                        >
                          Draft
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          size="sm"
                          disabled={!newTaskTitle.trim()}
                          className={`border rounded-[14px] transition-all ${
                            newTaskTitle.trim()
                              ? 'border-[#252232] bg-white text-[#252232] hover:bg-white hover:text-[#252232]'
                              : 'border-[#3a3a3a] bg-[#2a2a2a] text-[#5a5a5a] cursor-not-allowed'
                          }`}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Add Task Button */}
                {!isAddingTask && (
                  <Button
                    onClick={() => setIsAddingTask(true)}
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#2A2A2C] p-3 rounded-lg"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Add a task
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed shadow-xl py-2 px-2 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            borderRadius: '16px',
            background: '#1f1f1f',
            width: '180px',
            border: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-white transition-all text-sm my-1 rounded-xl hover:border hover:border-[#3b3a3a] hover:bg-[#1f1f1f]"
            onClick={() => handleEditTask(contextMenu.taskId)}
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-white transition-all text-sm my-1 rounded-xl hover:border hover:border-[#3b3a3a] hover:bg-[#1f1f1f]"
            onClick={() => handleDeleteTask(contextMenu.taskId)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Tasks;