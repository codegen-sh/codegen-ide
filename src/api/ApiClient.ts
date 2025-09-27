import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';
import { AuthManager } from '../auth/AuthManager';

export interface AgentRun {
    id: number;
    status: string;
    summary?: string;
    created_at: string;
    web_url?: string;
    github_pull_requests?: any[];
    source_type?: string;
}

export interface AgentRunsResponse {
    items: AgentRun[];
    total: number;
    page: number;
    per_page: number;
}

export interface CreateAgentRunRequest {
    prompt: string;
    model?: string;
    repo_id?: number;
}

// Client for communicating with the Codegen API
export class ApiClient {
    private client: AxiosInstance;

    constructor(private authManager: AuthManager) {
        const config = vscode.workspace.getConfiguration('codegen');
        const apiEndpoint = config.get('apiEndpoint', 'https://api.codegen.com');
        
        this.client = axios.create({
            baseURL: apiEndpoint,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor to include auth token
        this.client.interceptors.request.use(async (config) => {
            const token = await this.authManager.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Please login again.');
                    vscode.commands.executeCommand('codegen.logout');
                }
                return Promise.reject(error);
            }
        );
    }

    async getAgentRuns(page: number = 1, perPage: number = 10): Promise<AgentRunsResponse> {
        const orgId = this.authManager.getOrgId();
        if (!orgId) {
            throw new Error('No organization ID found. Please login again.');
        }

        try {
            const response = await this.client.get(`/v1/organizations/${orgId}/agent/runs`, {
                params: {
                    page,
                    per_page: perPage,
                    source_type: 'API' // Filter to API source type like the CLI does
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch agent runs:', error);
            throw new Error(`Failed to fetch agent runs: ${error.response?.data?.message || error.message}`);
        }
    }

    async createAgentRun(prompt: string, model?: string, repoId?: number): Promise<AgentRun> {
        const orgId = this.authManager.getOrgId();
        if (!orgId) {
            throw new Error('No organization ID found. Please login again.');
        }

        const requestData: CreateAgentRunRequest = {
            prompt,
            ...(model && { model }),
            ...(repoId && { repo_id: repoId })
        };

        try {
            const response = await this.client.post(`/v1/organizations/${orgId}/agent/run`, requestData);
            return response.data;
        } catch (error: any) {
            console.error('Failed to create agent run:', error);
            throw new Error(`Failed to create agent run: ${error.response?.data?.message || error.message}`);
        }
    }

    async getAgentRun(agentRunId: number): Promise<AgentRun> {
        const orgId = this.authManager.getOrgId();
        if (!orgId) {
            throw new Error('No organization ID found. Please login again.');
        }

        try {
            const response = await this.client.get(`/v1/organizations/${orgId}/agent/run/${agentRunId}`);
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch agent run:', error);
            throw new Error(`Failed to fetch agent run: ${error.response?.data?.message || error.message}`);
        }
    }
}
