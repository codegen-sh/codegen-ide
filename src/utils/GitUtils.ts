import * as vscode from 'vscode';
import * as path from 'path';

export interface GitRepository {
    name: string;
    owner: string;
    fullName: string;
    localPath: string;
}

export class GitUtils {
    /**
     * Get the current git repository information from the active workspace
     */
    static async getCurrentRepository(): Promise<GitRepository | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        // Try to get the repository from the first workspace folder
        const workspaceFolder = workspaceFolders[0];
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        
        if (!gitExtension) {
            console.warn('Git extension not found');
            return null;
        }

        if (!gitExtension.isActive) {
            await gitExtension.activate();
        }

        const git = gitExtension.exports.getAPI(1);
        if (!git) {
            console.warn('Git API not available');
            return null;
        }

        // Find the repository for the current workspace
        const repository = git.repositories.find((repo: any) => 
            repo.rootUri.fsPath === workspaceFolder.uri.fsPath
        );

        if (!repository) {
            console.warn('No git repository found in workspace');
            return null;
        }

        try {
            // Get remote origin URL
            const remotes = repository.state.remotes;
            const origin = remotes.find((remote: any) => remote.name === 'origin');
            
            if (!origin || !origin.fetchUrl) {
                console.warn('No origin remote found');
                return null;
            }

            const repoInfo = this.parseGitUrl(origin.fetchUrl);
            if (!repoInfo) {
                console.warn('Could not parse git URL:', origin.fetchUrl);
                return null;
            }

            return {
                ...repoInfo,
                localPath: repository.rootUri.fsPath
            };
        } catch (error) {
            console.error('Error getting repository info:', error);
            return null;
        }
    }

    /**
     * Parse a git URL to extract owner and repository name
     */
    private static parseGitUrl(url: string): { name: string; owner: string; fullName: string } | null {
        // Handle different Git URL formats
        const patterns = [
            // SSH format: git@github.com:owner/repo.git
            /^git@([^:]+):([^\/]+)\/(.+?)(?:\.git)?$/,
            // HTTPS format: https://github.com/owner/repo.git
            /^https?:\/\/([^\/]+)\/([^\/]+)\/(.+?)(?:\.git)?$/,
            // HTTP format: http://github.com/owner/repo.git
            /^https?:\/\/([^\/]+)\/([^\/]+)\/(.+?)(?:\.git)?$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const [, , owner, name] = match;
                return {
                    name: name.replace(/\.git$/, ''),
                    owner,
                    fullName: `${owner}/${name.replace(/\.git$/, '')}`
                };
            }
        }

        return null;
    }

    /**
     * Check if the current workspace has a git repository
     */
    static async hasGitRepository(): Promise<boolean> {
        const repo = await this.getCurrentRepository();
        return repo !== null;
    }

    /**
     * Get repository ID from the Codegen API based on the repository name
     * This would need to be implemented based on the API structure
     */
    static getRepositoryId(repoFullName: string): number | null {
        // This is a placeholder - in a real implementation, you'd need to:
        // 1. Call the Codegen API to get a list of repositories
        // 2. Find the matching repository by name
        // 3. Return its ID
        // For now, we'll return null and filter by repository name in the API call
        return null;
    }
}
