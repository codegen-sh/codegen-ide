import * as vscode from 'vscode';
import { AgentRunsProvider } from './providers/AgentRunsProvider';
import { AuthManager } from './auth/AuthManager';
import { ApiClient } from './api/ApiClient';
import { PrUtils } from './utils/PrUtils';

export function activate(context: vscode.ExtensionContext) {
    console.log('Codegen IDE extension is now active!');

    // Initialize auth manager
    const authManager = new AuthManager(context);
    
    // Initialize API client
    const apiClient = new ApiClient(authManager);
    
    // Initialize agent runs provider
    const agentRunsProvider = new AgentRunsProvider(apiClient, authManager);
    
    // Register tree data provider
    vscode.window.createTreeView('codegenAgentRuns', {
        treeDataProvider: agentRunsProvider,
        showCollapseAll: true
    });

    // Set authentication context
    vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());

    // Register commands
    const commands = [
        vscode.commands.registerCommand('codegen.login', async () => {
            await authManager.login();
            vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());
            agentRunsProvider.refresh();
        }),

        vscode.commands.registerCommand('codegen.logout', async () => {
            await authManager.logout();
            vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());
            agentRunsProvider.refresh();
        }),

        vscode.commands.registerCommand('codegen.showAgentRuns', () => {
            vscode.commands.executeCommand('workbench.view.extension.codegen');
        }),

        vscode.commands.registerCommand('codegen.createAgent', async () => {
            if (!authManager.isAuthenticated()) {
                const result = await vscode.window.showInformationMessage(
                    'You need to login to create agents',
                    'Login'
                );
                if (result === 'Login') {
                    await vscode.commands.executeCommand('codegen.login');
                }
                return;
            }

            const prompt = await vscode.window.showInputBox({
                prompt: 'Enter your agent prompt',
                placeHolder: 'e.g., Fix the bug in the login component',
                ignoreFocusOut: true
            });

            if (prompt) {
                try {
                    // Get current repository for context
                    const currentRepo = agentRunsProvider.getCurrentRepository();
                    const repoId = currentRepo ? undefined : undefined; // TODO: Map repository name to ID
                    
                    const agentRun = await apiClient.createAgentRun(prompt, undefined, repoId);
                    vscode.window.showInformationMessage(
                        `Agent run created successfully! ID: ${agentRun.id}`,
                        'View in Browser'
                    ).then(selection => {
                        if (selection === 'View in Browser' && agentRun.web_url) {
                            vscode.env.openExternal(vscode.Uri.parse(agentRun.web_url));
                        }
                    });
                    agentRunsProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create agent: ${error}`);
                }
            }
        }),

        vscode.commands.registerCommand('codegen.refreshAgentRuns', () => {
            agentRunsProvider.refresh();
        }),

        vscode.commands.registerCommand('codegen.openAgentRun', (agentRun) => {
            if (agentRun.web_url) {
                vscode.env.openExternal(vscode.Uri.parse(agentRun.web_url));
            }
        }),

        vscode.commands.registerCommand('codegen.openAgentRunOrPr', async (agentRun) => {
            // First, try to open the PR if it exists
            const prInfo = PrUtils.extractPrInfo(agentRun);
            
            if (prInfo) {
                // Get current repository for local path context
                const currentRepo = agentRunsProvider.getCurrentRepository();
                
                if (currentRepo && currentRepo.fullName === prInfo.repository) {
                    // We're in the same repository, try to open PR diff view
                    await PrUtils.openPrDiffView(prInfo, currentRepo.localPath);
                } else {
                    // Different repository or no local repo, open PR in browser
                    await PrUtils.openPrDiff(prInfo);
                }
            } else {
                // No PR, fall back to opening the agent run in browser
                if (agentRun.web_url) {
                    vscode.env.openExternal(vscode.Uri.parse(agentRun.web_url));
                }
            }
        })
    ];

    // Add all commands to subscriptions
    commands.forEach(command => context.subscriptions.push(command));

    // Auto-refresh setup
    const config = vscode.workspace.getConfiguration('codegen');
    if (config.get('autoRefresh', true)) {
        const interval = config.get('refreshInterval', 30) * 1000;
        const refreshTimer = setInterval(() => {
            if (authManager.isAuthenticated()) {
                agentRunsProvider.refresh();
            }
        }, interval);
        
        context.subscriptions.push({
            dispose: () => clearInterval(refreshTimer)
        });
    }
}

export function deactivate() {
    console.log('Codegen IDE extension is now deactivated');
}
