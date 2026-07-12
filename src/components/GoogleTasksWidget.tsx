import React from "react";
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  status: string;
}

export function GoogleTasksWidget() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchLists = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setTaskLists(data.items);
        if (data.items.length > 0 && !selectedList) {
          setSelectedList(data.items[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch task lists:', err);
      toast.error('Impossible de charger les listes Google Tasks');
    }
  };

  const fetchTasks = async (listId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.items || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toast.error('Impossible de charger les tâches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [token]);

  useEffect(() => {
    if (selectedList) {
      fetchTasks(selectedList);
    }
  }, [selectedList, token]);

  const handleToggleTask = async (task: Task) => {
    if (!token || !selectedList) return;
    
    // Optimistic update
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          status: newStatus
        })
      });
    } catch (err) {
      toast.error('Impossible de mettre à jour la tâche');
      // Revert on fail
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedList || !newTaskTitle.trim()) return;

    const title = newTaskTitle;
    setNewTaskTitle('');
    
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title
        })
      });
      const newTask = await res.json();
      setTasks(prev => [newTask, ...prev]);
      toast.success('Tâche ajoutée');
    } catch (err) {
      toast.error('Impossible d\'ajouter la tâche');
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3 className="text-base font-semibold leading-6 text-slate-900">Google Tasks</h3>
        </div>
        <div className="flex items-center gap-3">
          {taskLists.length > 0 && (
            <select
              value={selectedList || ''}
              onChange={(e) => setSelectedList(e.target.value)}
              className="text-sm border-slate-300 rounded-md py-1 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
            >
              {taskLists.map(list => (
                <option key={list.id} value={list.id}>{list.title}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => selectedList && fetchTasks(selectedList)}
            className="text-slate-400 hover:text-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <form onSubmit={handleAddTask} className="mb-4">
          <input
            type="text"
            placeholder="Ajouter une nouvelle tâche..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </form>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          {isLoading && tasks.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              Aucune tâche trouvée dans cette liste.
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors cursor-pointer"
                onClick={() => handleToggleTask(task)}
              >
                <button 
                  className={cn(
                    "mt-0.5 flex-shrink-0 transition-colors",
                    task.status === 'completed' ? "text-blue-500" : "text-slate-300 group-hover:text-slate-400"
                  )}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <span className={cn(
                  "text-sm",
                  task.status === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                )}>
                  {task.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
