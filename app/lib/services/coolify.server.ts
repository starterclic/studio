/**
 * Da Vinci Coolify API Client
 *
 * Integrates with Coolify v4 API to manage deployments
 * Documentation: https://coolify.io/docs/api
 */

interface CoolifyConfig {
  apiUrl: string;
  apiToken: string;
}

interface CoolifyApplication {
  uuid: string;
  name: string;
  description?: string;
  fqdn?: string;
  status: string;
  git_repository?: string;
  git_branch?: string;
  build_pack?: string;
  created_at: string;
  updated_at: string;
}

interface CoolifyServer {
  uuid: string;
  name: string;
  ip: string;
  user: string;
  port: number;
  is_reachable: boolean;
  is_usable: boolean;
}

interface DeploymentResponse {
  uuid: string;
  status: string;
  message: string;
}

class CoolifyClient {
  private apiUrl: string;
  private apiToken: string;
  private headers: Record<string, string>;

  constructor(config: CoolifyConfig) {
    this.apiUrl = config.apiUrl.replace(/\/+$/, ''); // Remove trailing slash
    this.apiToken = config.apiToken;
    this.headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Coolify API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get all servers
   */
  async getServers(): Promise<CoolifyServer[]> {
    const data = await this.request<{ data: CoolifyServer[] }>('/servers');
    return data.data;
  }

  /**
   * Get all applications
   */
  async getApplications(): Promise<CoolifyApplication[]> {
    const data = await this.request<{ data: CoolifyApplication[] }>('/applications');
    return data.data;
  }

  /**
   * Get application by UUID
   */
  async getApplication(uuid: string): Promise<CoolifyApplication> {
    const data = await this.request<{ data: CoolifyApplication }>(`/applications/${uuid}`);
    return data.data;
  }

  /**
   * Create a new public Git application
   */
  async createPublicGitApp(params: {
    project_uuid: string;
    server_uuid: string;
    environment_name: string;
    git_repository: string;
    git_branch: string;
    ports_exposes?: string;
    destination_uuid: string;
    build_pack?: 'nixpacks' | 'dockerfile' | 'docker-compose';
    name?: string;
    description?: string;
    domains?: string;
    install_command?: string;
    build_command?: string;
    start_command?: string;
  }): Promise<CoolifyApplication> {
    const data = await this.request<{ data: CoolifyApplication }>('/applications/public', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.data;
  }

  /**
   * Deploy an application
   */
  async deployApplication(
    uuid: string,
    options?: {
      force_rebuild?: boolean;
      commit_sha?: string;
    }
  ): Promise<DeploymentResponse> {
    const data = await this.request<DeploymentResponse>(
      `/applications/${uuid}/deploy`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );
    return data;
  }

  /**
   * Start an application
   */
  async startApplication(uuid: string): Promise<{ message: string }> {
    return this.request(`/applications/${uuid}/start`, {
      method: 'POST',
    });
  }

  /**
   * Stop an application
   */
  async stopApplication(uuid: string): Promise<{ message: string }> {
    return this.request(`/applications/${uuid}/stop`, {
      method: 'POST',
    });
  }

  /**
   * Restart an application
   */
  async restartApplication(uuid: string): Promise<{ message: string }> {
    return this.request(`/applications/${uuid}/restart`, {
      method: 'POST',
    });
  }

  /**
   * Get application logs
   */
  async getApplicationLogs(uuid: string): Promise<{ logs: string }> {
    return this.request(`/applications/${uuid}/logs`);
  }

  /**
   * Update application
   */
  async updateApplication(
    uuid: string,
    updates: Partial<{
      name: string;
      description: string;
      fqdn: string;
      git_branch: string;
      build_pack: string;
      install_command: string;
      build_command: string;
      start_command: string;
    }>
  ): Promise<CoolifyApplication> {
    const data = await this.request<{ data: CoolifyApplication }>(
      `/applications/${uuid}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    return data.data;
  }

  /**
   * Delete an application
   */
  async deleteApplication(uuid: string): Promise<{ message: string }> {
    return this.request(`/applications/${uuid}`, {
      method: 'DELETE',
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await fetch(`${this.apiUrl.replace('/api', '')}/api/health`);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let coolifyClient: CoolifyClient | null = null;

/**
 * Get Coolify client instance
 */
export function getCoolifyClient(): CoolifyClient {
  if (!coolifyClient) {
    const apiUrl = process.env.COOLIFY_API_URL;
    const apiToken = process.env.COOLIFY_API_TOKEN;

    if (!apiUrl || !apiToken) {
      throw new Error(
        'Coolify configuration missing. Please set COOLIFY_API_URL and COOLIFY_API_TOKEN environment variables.'
      );
    }

    coolifyClient = new CoolifyClient({
      apiUrl,
      apiToken,
    });
  }

  return coolifyClient;
}

export type {
  CoolifyApplication,
  CoolifyServer,
  DeploymentResponse,
};
