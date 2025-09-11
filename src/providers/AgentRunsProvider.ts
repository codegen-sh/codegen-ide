import * as vscode from 'vscode';
import { ApiClient, AgentRun } from '../api/ApiClient';
import { AuthManager } from '../auth/AuthManager';

export class AgentRunItem extends vscode.TreeItem {
    constructor(
        public readonly agentRun: AgentRun,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(agentRun.summary || `Agent Run ${agentRun.id}`, collapsibleState);
        
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.iconPath = this.getIcon();
        this.contextValue = 'agentRun';
        
        // Make it clickable to open in browser
        this.command = {
            command: 'codegen.openAgentRun',
            title: 'Open Agent Run',
            arguments: [agentRun]
        };
    }

    private getTooltip(): string {
        const createdAt = new Date(this.agentRun.created_at).toLocaleString();
        const summary = this.agentRun.summary || 'No summary available';
        const status = this.agentRun.status;
        const prCount = this.agentRun.github_pull_requests?.length || 0;
        
        return `ID: ${this.agentRun.id}\nStatus: ${status}\nCreated: ${createdAt}\nPRs: ${prCount}\n\n${summary}`;
    }

    private getDescription(): string {
        const status = this.agentRun.status;
        const createdAt = new Date(this.agentRun.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let timeAgo: string;
        if (diffDays > 0) {
            timeAgo = `${diffDays}d ago`;
        } else if (diffHours > 0) {
            timeAgo = `${diffHours}h ago`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            timeAgo = `${diffMinutes}m ago`;
        }
        
        const prCount = this.agentRun.github_pull_requests?.length || 0;
        const prText = prCount > 0 ? ` • ${prCount} PR${prCount > 1 ? 's' : ''}` : '';
        
        return `${status} • ${timeAgo}${prText}`;
    }

    private getIcon(): vscode.ThemeIcon {
        const status = this.agentRun.status.toLowerCase();
        
        switch (status) {
            case 'complete':
            case 'completed':
                return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
            case 'running':
            case 'in_progress':
                return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.blue'));
            case 'failed':
            case 'error':
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
            case 'pending':
            case 'queued':
                return new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
            default:
                return new vscode.ThemeIcon('robot');
        }
    }
}

export class AgentRunsProvider implements vscode.TreeDataProvider<AgentRunItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AgentRunItem | undefined | null | void> = new vscode.EventEmitter<AgentRunItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AgentRunItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private agentRuns: AgentRun[] = [];

    constructor(
        private apiClient: ApiClient,
        private authManager: AuthManager
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AgentRunItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AgentRunItem): Promise<AgentRunItem[]> {
        if (!this.authManager.isAuthenticated()) {
            return [];
        }

        if (!element) {
            // Root level - return agent runs
            try {
                const response = await this.apiClient.getAgentRuns(1, 20); // Get first 20 runs
                this.agentRuns = response.items;
                
                return this.agentRuns.map(agentRun => 
                    new AgentRunItem(agentRun, vscode.TreeItemCollapsibleState.None)
                );
            } catch (error) {
                console.error('Failed to load agent runs:', error);
                vscode.window.showErrorMessage(`Failed to load agent runs: ${error}`);
                return [];
            }
        }

        return [];
    }
}
