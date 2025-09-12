import * as vscode from 'vscode';
import { ApiClient, AgentRun } from '../api/ApiClient';
import { AuthManager } from '../auth/AuthManager';

export class HomeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codegenHome';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly apiClient: ApiClient,
        private readonly authManager: AuthManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'createAgent':
                    await this._createAgent(data.prompt);
                    break;
                case 'login':
                    await vscode.commands.executeCommand('codegen.login');
                    this._updateView();
                    break;
                case 'refresh':
                    this._updateView();
                    break;
            }
        });

        // Update view when authentication changes
        this._updateView();
    }

    private async _createAgent(prompt: string) {
        if (!this.authManager.isAuthenticated()) {
            vscode.window.showErrorMessage('Please login first');
            return;
        }

        if (!prompt?.trim()) {
            vscode.window.showErrorMessage('Please enter a prompt');
            return;
        }

        try {
            const agentRun = await this.apiClient.createAgentRun(prompt.trim());
            vscode.window.showInformationMessage(
                `Agent run created successfully! ID: ${agentRun.id}`,
                'View in Browser'
            ).then(selection => {
                if (selection === 'View in Browser' && agentRun.web_url) {
                    vscode.env.openExternal(vscode.Uri.parse(agentRun.web_url));
                }
            });
            
            // Refresh the agent runs view
            vscode.commands.executeCommand('codegen.refreshAgentRuns');
            this._updateView();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create agent: ${error}`);
        }
    }

    private async _updateView() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const isAuthenticated = this.authManager.isAuthenticated();
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Codegen Home</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 16px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    margin-bottom: 8px;
                }
                
                .subtitle {
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }
                
                .new-agent-section {
                    margin-bottom: 32px;
                }
                
                .new-agent-button {
                    width: 100%;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #8B5CF6, #A855F7);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .new-agent-button:hover {
                    background: linear-gradient(135deg, #7C3AED, #9333EA);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }
                
                .new-agent-button:active {
                    transform: translateY(0);
                }
                
                .new-agent-button:disabled {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                
                .prompt-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: 14px;
                    resize: vertical;
                    min-height: 80px;
                    box-sizing: border-box;
                }
                
                .prompt-input:focus {
                    outline: none;
                    border-color: var(--vscode-focusBorder);
                }
                
                .prompt-input::placeholder {
                    color: var(--vscode-input-placeholderForeground);
                }
                
                .login-section {
                    text-align: center;
                    padding: 32px 16px;
                }
                
                .login-button {
                    padding: 10px 20px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .login-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .description {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    line-height: 1.4;
                    margin-bottom: 16px;
                }
                
                .icon {
                    width: 16px;
                    height: 16px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🤖 Codegen</div>
                <div class="subtitle">AI-powered code agents</div>
            </div>
            
            ${isAuthenticated ? `
                <div class="new-agent-section">
                    <button class="new-agent-button" onclick="createAgent()">
                        <span>✨</span>
                        New Agent
                    </button>
                    <textarea 
                        class="prompt-input" 
                        id="promptInput" 
                        placeholder="Describe what you want your agent to do...

Examples:
• Fix the bug in the login component
• Add input validation to the user form
• Refactor the API client to use TypeScript
• Write unit tests for the auth service"
                        onkeydown="handleKeyDown(event)"
                    ></textarea>
                    <div class="description">
                        Create a new background agent that will work on your codebase. Your agent will appear in the Recent Agent Runs section below.
                    </div>
                </div>
            ` : `
                <div class="login-section">
                    <div class="description">
                        Welcome to Codegen! To get started, you need to authenticate with your Codegen account.
                    </div>
                    <button class="login-button" onclick="login()">
                        Login to Codegen
                    </button>
                    <div class="description" style="margin-top: 16px;">
                        Once logged in, you'll be able to create and manage AI agents that help with your code tasks.
                    </div>
                </div>
            `}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function createAgent() {
                    const promptInput = document.getElementById('promptInput');
                    const prompt = promptInput.value.trim();
                    
                    if (!prompt) {
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'createAgent',
                        prompt: prompt
                    });
                    
                    // Clear the input
                    promptInput.value = '';
                }
                
                function login() {
                    vscode.postMessage({
                        type: 'login'
                    });
                }
                
                function handleKeyDown(event) {
                    // Ctrl/Cmd + Enter to create agent
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                        event.preventDefault();
                        createAgent();
                    }
                }
            </script>
        </body>
        </html>`;
    }

    public refresh() {
        this._updateView();
    }
}
