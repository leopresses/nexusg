import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskWithClient extends Omit<Task, "checklist"> {
  client: Client | null;
  checklist: ChecklistItem[];
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      // Get tasks with client info
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          client:clients(*)
        `)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      const formattedTasks: TaskWithClient[] = (tasksData || []).map((task: any) => ({
        ...task,
        client: task.client,
        checklist: (task.checklist as unknown as ChecklistItem[]) || [],
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tarefas");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (
    taskId: string, 
    updates: Partial<Pick<Task, "status" | "checklist" | "completed_at">>
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          ...updates,
          checklist: updates.checklist ? JSON.parse(JSON.stringify(updates.checklist)) : undefined,
        })
        .eq("id", taskId);

      if (error) throw error;
      
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updates } as TaskWithClient
          : task
      ));
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa");
      // Revert on error
      fetchTasks();
    }
  };

  const toggleChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const allCompleted = updatedChecklist.every(item => item.completed);
    const someCompleted = updatedChecklist.some(item => item.completed);
    
    const newStatus = allCompleted ? "completed" : someCompleted ? "in_progress" : "pending";
    const completedAt = allCompleted ? new Date().toISOString() : null;

    await updateTask(taskId, {
      checklist: updatedChecklist as any,
      status: newStatus,
      completed_at: completedAt,
    });
  };

  const stats = {
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return {
    tasks,
    clients,
    isLoading,
    stats,
    toggleChecklistItem,
    refetch: fetchTasks,
  };
}
