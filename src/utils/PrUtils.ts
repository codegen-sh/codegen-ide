import * as vscode from 'vscode';
import { AgentRun } from '../api/ApiClient';

export interface PullRequest {
    number: number;
    title: string;
    url: string;
    head_sha: string;
    base_sha: string;
    repository: string;
}

export class PrUtils {
    /**
     * Extract PR information from an agent run
     */
    static extractPrInfo(agentRun: AgentRun): PullRequest | null {
        if (!agentRun.github_pull_requests || agentRun.github_pull_requests.length === 0) {
            return null;
        }

        // Get the first PR (most recent)
        const pr = agentRun.github_pull_requests[0];
        
        if (!pr.number || !pr.html_url) {
            return null;
        }

        return {
            number: pr.number,
            title: pr.title || `PR #${pr.number}`,
            url: pr.html_url,
            head_sha: pr.head?.sha || '',
            base_sha: pr.base?.sha || '',
            repository: pr.base?.repo?.full_name || ''
        };
    }

    /**
     * Open a PR diff in VSCode using the GitHub Pull Requests extension
     */
    static async openPrDiff(pr: PullRequest): Promise<void> {
        try {
            // First, try to use the GitHub Pull Requests extension
            const githubExtension = vscode.extensions.getExtension('GitHub.vscode-pull-request-github');
            
            if (githubExtension) {
                if (!githubExtension.isActive) {
                    await githubExtension.activate();
                }

                // Try to open the PR using the GitHub extension command
                try {
                    await vscode.commands.executeCommand('pr.openPullRequestInGitHub', pr.url);
                    return;
                } catch (error) {
                    console.warn('Failed to open PR with GitHub extension:', error);
                }
            }

            // Fallback: Open the PR URL in the browser
            await vscode.env.openExternal(vscode.Uri.parse(pr.url));
            
        } catch (error) {
            console.error('Failed to open PR:', error);
            vscode.window.showErrorMessage(`Failed to open PR: ${error}`);
        }
    }

    /**
     * Open PR diff view using VSCode's built-in diff viewer
     * This requires the repository to be cloned locally
     */
    static async openPrDiffView(pr: PullRequest, localRepoPath: string): Promise<void> {
        try {
            // Check if we have the GitHub extension for better PR integration
            const githubExtension = vscode.extensions.getExtension('GitHub.vscode-pull-request-github');
            
            if (githubExtension && githubExtension.isActive) {
                // Try to use the GitHub extension's PR view
                try {
                    await vscode.commands.executeCommand('pr.openPullRequestInGitHub', pr.url);
                    return;
                } catch (error) {
                    console.warn('GitHub extension command failed:', error);
                }
            }

            // Fallback: Show information and open in browser
            const action = await vscode.window.showInformationMessage(
                `PR #${pr.number}: ${pr.title}`,
                'View in Browser',
                'Copy URL'
            );

            if (action === 'View in Browser') {
                await vscode.env.openExternal(vscode.Uri.parse(pr.url));
            } else if (action === 'Copy URL') {
                await vscode.env.clipboard.writeText(pr.url);
                vscode.window.showInformationMessage('PR URL copied to clipboard');
            }

        } catch (error) {
            console.error('Failed to open PR diff view:', error);
            vscode.window.showErrorMessage(`Failed to open PR diff: ${error}`);
        }
    }

    /**
     * Check if the GitHub Pull Requests extension is available
     */
    static isGitHubExtensionAvailable(): boolean {
        const githubExtension = vscode.extensions.getExtension('GitHub.vscode-pull-request-github');
        return githubExtension !== undefined;
    }

    /**
     * Get a user-friendly description of PR status
     */
    static getPrStatusDescription(agentRun: AgentRun): string {
        const prCount = agentRun.github_pull_requests?.length || 0;
        
        if (prCount === 0) {
            return 'No PRs';
        } else if (prCount === 1) {
            const pr = agentRun.github_pull_requests![0];
            return `PR #${pr.number}`;
        } else {
            return `${prCount} PRs`;
        }
    }
}
