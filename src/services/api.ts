/**
 * API Service for Resource Assignment Dashboard
 *
 * Backend API Base URL: Set via VITE_API_BASE_URL environment variable
 * Default: https://resource-search-backend.onrender.com/api (Render backend)
 * Override: Set VITE_API_BASE_URL in .env.local or Vercel environment variables
 */

// API Base URL from environment variable
// Defaults to production Render backend
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://resource-search-backend.onrender.com/api";

// Log API base URL for debugging
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

export interface Resource {
  id: number;
  name: string;
  email: string;
  department: string;
  title: string;
  experience_years: number;
  skills: string[];
  availability: string;
  current_workload: number;
  max_capacity: number;
  location: string;
  expertise_level: string;
  projects_completed: number;
  specializations: string[];
  teams_id: string;
  match_score?: number;
  recommendation_reason?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  required_skills: string[];
  estimated_hours: number;
  deadline: string;
  assigned_resource: number | null;
  department: string;
  complexity: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string>),
      };

      const url = `${this.baseUrl}${endpoint}`;
      console.log(`📡 API Call: ${options?.method || "GET"} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `API Error (${response.status}): ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `${errorMessage} - ${errorText}`;
            }
          } catch (textError) {
            // Ignore text parsing errors
          }
        }

        console.error(`❌ API Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const dataStr = JSON.stringify(data);
      if (dataStr.length > 200) {
        console.log(`✅ API Success: ${dataStr.substring(0, 200)}...`);
      } else {
        console.log(`✅ API Success:`, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ API call failed for ${endpoint}:`, error.message);
      } else {
        console.error(`❌ API call failed for ${endpoint}:`, error);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.fetchApi("/health");
  }

  async getAllResources(filters?: {
    availability?: string;
    skill?: string;
    expertise_level?: string;
    department?: string;
  }): Promise<{ success: boolean; count: number; resources: Resource[] }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return this.fetchApi(`/resources${query ? `?${query}` : ""}`);
  }

  async getResourceById(
    id: number
  ): Promise<{ success: boolean; resource: Resource }> {
    return this.fetchApi(`/resources/${id}`);
  }

  async getAllTasks(filters?: {
    status?: string;
    priority?: string;
  }): Promise<{ success: boolean; count: number; tasks: Task[] }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString();
    return this.fetchApi(`/tasks${query ? `?${query}` : ""}`);
  }

  async assignTask(
    taskId: number,
    resourceId: number
  ): Promise<{
    success: boolean;
    task: Task;
  }> {
    return this.fetchApi(`/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ resource_id: resourceId }),
    });
  }

  async searchResources(
    query: string,
    topK: number = 10
  ): Promise<{
    success: boolean;
    query: string;
    count: number;
    resources: Resource[];
  }> {
    return this.fetchApi("/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k: topK }),
    });
  }

  async recommendResources(
    taskDescription: string,
    topK: number = 5,
    taskId?: number,
    taskTitle?: string,
    useAi: boolean = true
  ): Promise<{
    success: boolean;
    task: string;
    count: number;
    recommendations: Resource[];
    task_analysis?: any;
    analysis_summary?: string;
    ai_powered?: boolean;
  }> {
    return this.fetchApi("/recommend", {
      method: "POST",
      body: JSON.stringify({
        task_description: taskDescription,
        task_title: taskTitle,
        top_k: topK,
        task_id: taskId,
        use_ai: useAi,
      }),
    });
  }

  async getStats(): Promise<{
    success: boolean;
    stats: {
      total_resources: number;
      available_resources: number;
      busy_resources: number;
      total_tasks: number;
      pending_tasks: number;
      assigned_tasks: number;
      average_workload: number;
      top_skills: Array<{ skill: string; count: number }>;
    };
  }> {
    return this.fetchApi("/stats");
  }
}

export const apiService = new ApiService(API_BASE_URL);
