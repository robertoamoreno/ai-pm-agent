export interface ClickUpTeam {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
}

export interface ClickUpStatus {
  id: string;
  status: string;
  orderindex: number;
  color: string;
  type: string;
}

export interface ClickUpTask {
  name: string;
  description: string;
  status?: string;
  priority?: number;
  tags?: string[];
}

export interface ClickUpTaskCreate {
  name: string;
  description?: string;
  markdown_content?: string;
  assignees?: number[];
  tags?: string[];
  status?: string;
  priority?: number | null;
  due_date?: number;
  due_date_time?: boolean;
  time_estimate?: number;
  start_date?: number;
  start_date_time?: boolean;
  notify_all?: boolean;
  parent?: string | null;
  links_to?: string | null;
  check_required_custom_fields?: boolean;
}

export interface ClickUpTaskResponse {
  id: string;
  name: string;
  text_content: string;
  description: string;
  status: {
    status: string;
    color: string;
    type: string;
    orderindex: number;
  };
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  archived: boolean;
  creator: {
    id: number;
    username: string;
    color: string;
    profilePicture: string;
  };
  assignees: Array<{
    id: number;
    username: string;
    color: string;
    profilePicture: string;
  }>;
  watchers: Array<{
    id: number;
    username: string;
    color: string;
    profilePicture: string;
  }>;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  space: {
    id: string;
  };
}

export class ClickUpService {
  private baseUrl = 'https://api.clickup.com/api/v2';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.token.startsWith('pk_') ? this.token : `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.err || data.error || response.statusText;
      throw new Error(`ClickUp API error: ${errorMessage} (${response.status})`);
    }

    return data;
  }

  async getSpaces(): Promise<ClickUpSpace[]> {
    const teams = await this.request<{ teams: ClickUpTeam[] }>('/team');
    const spaces: ClickUpSpace[] = [];
    
    for (const team of teams.teams) {
      const teamSpaces = await this.request<{ spaces: ClickUpSpace[] }>(`/team/${team.id}/space`);
      spaces.push(...teamSpaces.spaces);
    }
    
    return spaces;
  }

  async getLists(spaceId: string): Promise<ClickUpList[]> {
    const folderlessLists = await this.request<{ lists: ClickUpList[] }>(`/space/${spaceId}/list`);
    const folders = await this.request<{ folders: ClickUpFolder[] }>(`/space/${spaceId}/folder`);
    const lists = [...folderlessLists.lists];

    for (const folder of folders.folders) {
      const folderLists = await this.request<{ lists: ClickUpList[] }>(`/folder/${folder.id}/list`);
      lists.push(...folderLists.lists);
    }

    return lists;
  }

  async getListStatuses(listId: string): Promise<ClickUpStatus[]> {
    const response = await this.request<{ statuses: ClickUpStatus[] }>(`/list/${listId}`);
    return response.statuses;
  }

  async getDefaultStatus(listId: string): Promise<string> {
    const statuses = await this.getListStatuses(listId);
    // Find the status with the lowest orderindex (usually "to do" or "open")
    const defaultStatus = statuses.sort((a, b) => a.orderindex - b.orderindex)[0];
    if (!defaultStatus) {
      throw new Error('No status found for the selected list');
    }
    return defaultStatus.status;
  }

  async createTask(listId: string, task: ClickUpTaskCreate): Promise<ClickUpTaskResponse> {
    // If no status is provided, use the list's default status
    if (!task.status) {
      task.status = await this.getDefaultStatus(listId);
    }
    return this.request<ClickUpTaskResponse>(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async addAttachment(taskId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('attachment', file);

    await fetch(`${this.baseUrl}/task/${taskId}/attachment`, {
      method: 'POST',
      headers: {
        'Authorization': this.token.startsWith('pk_') ? this.token : `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.request<{ teams: ClickUpTeam[] }>('/team');
      return true;
    } catch {
      return false;
    }
  }
}
