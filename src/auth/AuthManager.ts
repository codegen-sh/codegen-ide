import * as vscode from 'vscode';

export class AuthManager {
    private static readonly TOKEN_KEY = 'codegen.token';
    private static readonly ORG_ID_KEY = 'codegen.orgId';
    
    constructor(private context: vscode.ExtensionContext) {}

    async login(): Promise<void> {
        const token = await vscode.window.showInputBox({
            prompt: 'Enter your Codegen API token',
            placeHolder: 'Your API token from codegen.com',
            password: true,
            ignoreFocusOut: true
        });

        if (!token) {
            return;
        }

        // Store the token securely
        await this.context.secrets.store(AuthManager.TOKEN_KEY, token);
        
        // Try to get organization info
        try {
            const orgId = await this.fetchOrgId(token);
            if (orgId) {
                await this.context.globalState.update(AuthManager.ORG_ID_KEY, orgId);
            }
            
            vscode.window.showInformationMessage('Successfully logged in to Codegen!');
        } catch (error) {
            vscode.window.showErrorMessage(`Login failed: ${error}`);
            // Clear the token if login failed
            await this.context.secrets.delete(AuthManager.TOKEN_KEY);
            throw error;
        }
    }

    async logout(): Promise<void> {
        await this.context.secrets.delete(AuthManager.TOKEN_KEY);
        await this.context.globalState.update(AuthManager.ORG_ID_KEY, undefined);
        vscode.window.showInformationMessage('Successfully logged out from Codegen');
    }

    async getToken(): Promise<string | undefined> {
        return await this.context.secrets.get(AuthManager.TOKEN_KEY);
    }

    getOrgId(): number | undefined {
        return this.context.globalState.get(AuthManager.ORG_ID_KEY);
    }

    isAuthenticated(): boolean {
        // We can't await here, so we check if we have stored credentials
        // The actual validation happens when making API calls
        return this.context.globalState.get(AuthManager.ORG_ID_KEY) !== undefined;
    }

    private async fetchOrgId(token: string): Promise<number | undefined> {
        const config = vscode.workspace.getConfiguration('codegen');
        const apiEndpoint = config.get('apiEndpoint', 'https://api.codegen.com');
        
        // This is a simplified version - in a real implementation, you'd make an API call
        // to get the user's organization information
        // For now, we'll use a default org ID or prompt the user
        
        const orgIdInput = await vscode.window.showInputBox({
            prompt: 'Enter your organization ID (optional)',
            placeHolder: 'Leave empty to use default organization',
            ignoreFocusOut: true
        });

        if (orgIdInput && !isNaN(Number(orgIdInput))) {
            return Number(orgIdInput);
        }

        // Return a default org ID or undefined
        return undefined;
    }
}
