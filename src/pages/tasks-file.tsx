import React, { useState } from 'react';
import TasksHeader from '@/components/tasks/TasksHeader';
import DateSelector from '@/components/tasks/DateSelector';
import PrioritySelector from '@/components/tasks/PrioritySelector';
import ReminderSelector from '@/components/tasks/ReminderSelector';
import LabelSelector from '@/components/tasks/LabelSelector';
import { Plus, ChevronRight, MoveVertical as MoreVertical, Calendar, Flag, Bell, Tag, Link, Edit, Trash2, Repeat } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  creationDate: string;
  dueDate?: string;
  time?: string;
  priority: string;
  description: string;
  reminder?: string;
  labels?: string[];
  repeat?: string;
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [expandedLabelsTaskId, setExpandedLabelsTaskId] = useState<string | null>(null);
  const [selectedRepeat, setSelectedRepeat] = useState<string>('');
  const [filterSettings, setFilterSettings] = useState(() => {
    const saved = localStorage.getItem('kario-filter-settings');
    return saved ? JSON.parse(saved) : { date: false, priority: false, label: false };
  });
  const [sortSettings, setSortSettings] = useState(() => {
    const saved = localStorage.getItem('kario-sort-settings');
    return saved ? JSON.parse(saved) : { completionStatus: false, creationDate: true, pages: false, chats: false };
  });
  const [filterValues, setFilterValues] = useState(() => {
    const saved = localStorage.getItem('kario-filter-values');
    return saved ? JSON.parse(saved) : { date: '', priority: '', label: '' };
  });

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

  const getLabelColor = (labelName: string): string => {
    const saved = localStorage.getItem('kario-labels');
    if (saved) {
      const customLabels = JSON.parse(saved);
      const found = customLabels.find((l: { name: string; color: string }) => l.name === labelName);
      if (found) return found.color;
    }

    const presetLabels: { name: string; color: string }[] = [
      { name: '#ByKairo', color: 'text-blue-500' },
      { name: '#School', color: 'text-green-500' },
      { name: '#Work', color: 'text-orange-500' },
      { name: '#Personal', color: 'text-pink-500' },
      { name: '#Urgent', color: 'text-red-500' },
      { name: '#Shopping', color: 'text-cyan-500' },
      { name: '#Health', color: 'text-emerald-500' },
      { name: '#Finance', color: 'text-amber-500' },
      { name: '#Family', color: 'text-rose-500' },
      { name: '#Projects', color: 'text-teal-500' },
    ];
    const preset = presetLabels.find(l => l.name === labelName);
    return preset?.color || 'text-gray-400';
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
        dueDate: selectedDate ? selectedDate.toLocaleDateString() : undefined,
        time: selectedTime ? selectedTime : undefined,
        priority: selectedPriority,
        description: newTaskDescription.trim(),
        reminder: selectedReminder,
        labels: selectedLabels,
        repeat: selectedRepeat || undefined
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
      setSelectedRepeat('');
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
    const taskToEdit = tasks.find(t => t.id === taskId);
    if (taskToEdit) {
      setEditingTaskId(taskId);
      setEditTitle(taskToEdit.title);
      setEditDescription(taskToEdit.description);
      setEditPriority(taskToEdit.priority);
      setEditDate(new Date(taskToEdit.dueDate));
    }
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editingTaskId) {
      const updatedTasks = tasks.map(task =>
        task.id === editingTaskId
          ? {
              ...task,
              title: editTitle.trim(),
              description: editDescription.trim(),
              priority: editPriority,
              dueDate: editDate ? editDate.toLocaleDateString() : task.dueDate
            }
          : task
      );
      setTasks(updatedTasks);
      localStorage.setItem('kario-tasks', JSON.stringify(updatedTasks));
      setEditingTaskId(null);
      setEditTitle('');
      setEditDescription('');
      setEditPriority('');
      setEditDate(undefined);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('');
    setEditDate(undefined);
  };

  const handleOpenTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleEditTask(taskId);
    }
    setContextMenu(null);
  };

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setExpandedLabelsTaskId(null);
    };
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

  const applyFiltersAndSort = (tasksToFilter: Task[]): Task[] => {
    let filtered = [...tasksToFilter];

    if (filterSettings.date && filterValues.date) {
      filtered = filtered.filter(task => task.dueDate === filterValues.date);
    }

    if (filterSettings.priority && filterValues.priority) {
      filtered = filtered.filter(task => task.priority === filterValues.priority);
    }

    if (filterSettings.label && filterValues.label) {
      filtered = filtered.filter(task => task.labels?.includes(filterValues.label));
    }

    if (sortSettings.completionStatus) {
      filtered.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }

    if (sortSettings.creationDate) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.creationDate).getTime();
        const dateB = new Date(b.creationDate).getTime();
        return dateB - dateA;
      });
    }

    return filtered;
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
        filterSettings={filterSettings}
        setFilterSettings={(settings) => {
          setFilterSettings(settings);
          localStorage.setItem('kario-filter-settings', JSON.stringify(settings));
        }}
        sortSettings={sortSettings}
        setSortSettings={(settings) => {
          setSortSettings(settings);
          localStorage.setItem('kario-sort-settings', JSON.stringify(settings));
        }}
        filterValues={filterValues}
        setFilterValues={(values) => {
          setFilterValues(values);
          localStorage.setItem('kario-filter-values', JSON.stringify(values));
        }}
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
                  {applyFiltersAndSort(tasks).length}
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
                {/* Card-based task list */}
                <div className="space-y-3">
                  {applyFiltersAndSort(tasks).map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-[12px] p-4 bg-transparent hover:bg-[#1f1f1f] transition-all ${
                        draggedTaskId === task.id ? 'opacity-50' : ''
                      } ${
                        dragOverTaskId === task.id ? 'border border-blue-500' : ''
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, task.id)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                      style={{ cursor: draggedTaskId === task.id ? 'grabbing' : 'grab' }}
                    >
                      {/* Title with checkbox */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-4 h-4 border-2 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
                            task.completed
                              ? 'bg-white border-white'
                              : 'border-gray-400 hover:border-gray-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task.id);
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

                      {/* Description */}
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

                      {/* Bottom row: Date/Time tag, Priority, Reminder */}
                      <div className="ml-6 flex items-center gap-2 flex-wrap">
                        {/* Date and Time Tag */}
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

                        {/* Priority Badge */}
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

                        {/* Reminder Indicator */}
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

                        {/* Repeat Indicator */}
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

                        {/* Labels - Consolidated into single button with tooltip and expandable view */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="relative">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLabelsTaskId(expandedLabelsTaskId === task.id ? null : task.id);
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

                            {/* Expanded labels view in popup bubble */}
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
                  ))}
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
                          selectedRepeat={selectedRepeat}
                          onRepeatSelect={setSelectedRepeat}
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
            onClick={() => handleOpenTask(contextMenu.taskId)}
          >
            <ChevronRight className="w-4 h-4" />
            <span>Open</span>
          </button>
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

      {/* Edit Task Modal */}
      {editingTaskId && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={handleCancelEdit}>
          <div
            className="bg-[#1b1b1b] border border-[#525252] rounded-[20px] p-6 w-full max-w-[500px] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white text-xl font-semibold mb-4">Edit Task</h2>

            {/* Title */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title"
                className="w-full bg-[#252525] border-[#414141] text-white placeholder-gray-400 focus:ring-0 focus:border-[#414141]"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Task description"
                className="w-full bg-[#252525] border border-[#414141] text-white placeholder-gray-400 focus:ring-0 p-3 resize-none min-h-[100px] rounded-lg outline-none text-sm"
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full bg-[#252525] border border-[#414141] text-white focus:ring-0 p-2 rounded-lg outline-none text-sm"
              >
                <option value="Priority 1">Priority 1</option>
                <option value="Priority 2">Priority 2</option>
                <option value="Priority 3">Priority 3</option>
                <option value="Priority 4">Priority 4</option>
                <option value="Priority 5">Priority 5</option>
                <option value="Priority 6">Priority 6</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleCancelEdit}
                variant="ghost"
                size="sm"
                className="border border-[#690707] rounded-[10px] bg-[#391e1e] text-[crimson] hover:bg-[#391e1e] hover:text-[crimson]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                size="sm"
                disabled={!editTitle.trim()}
                className={`border rounded-[14px] transition-all ${
                  editTitle.trim()
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

    </div>
  );
};

export default Tasks;