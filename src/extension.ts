import * as vscode from 'vscode';
import { AgentRunsProvider } from './providers/AgentRunsProvider';
import { HomeViewProvider } from './providers/HomeViewProvider';
import { AuthManager } from './auth/AuthManager';
import { ApiClient } from './api/ApiClient';

export function activate(context: vscode.ExtensionContext) {
    console.log('Codegen IDE extension is now active!');

    // Initialize auth manager
    const authManager = new AuthManager(context);
    
    // Initialize API client
    const apiClient = new ApiClient(authManager);
    
    // Initialize providers
    const agentRunsProvider = new AgentRunsProvider(apiClient, authManager);
    const homeViewProvider = new HomeViewProvider(context.extensionUri, apiClient, authManager);
    
    // Register tree data provider
    vscode.window.createTreeView('codegenAgentRuns', {
        treeDataProvider: agentRunsProvider,
        showCollapseAll: true
    });

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('codegenHome', homeViewProvider)
    );

    // Set authentication context
    vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());

    // Register commands
    const commands = [
        vscode.commands.registerCommand('codegen.login', async () => {
            await authManager.login();
            vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());
            agentRunsProvider.refresh();
            homeViewProvider.refresh();
        }),

        vscode.commands.registerCommand('codegen.logout', async () => {
            await authManager.logout();
            vscode.commands.executeCommand('setContext', 'codegen.authenticated', authManager.isAuthenticated());
            agentRunsProvider.refresh();
            homeViewProvider.refresh();
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
                    const agentRun = await apiClient.createAgentRun(prompt);
                    vscode.window.showInformationMessage(
                        `Agent run created successfully! ID: ${agentRun.id}`,
                        'View in Browser'
                    ).then(selection => {
                        if (selection === 'View in Browser' && agentRun.web_url) {
                            vscode.env.openExternal(vscode.Uri.parse(agentRun.web_url));
                        }
                    });
                    agentRunsProvider.refresh();
                    homeViewProvider.refresh();
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
