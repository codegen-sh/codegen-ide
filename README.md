# Codegen IDE - VSCode Extension

A VSCode extension for [Codegen](https://codegen.com) that allows you to create and manage async code agents directly from your editor.

## Features

🤖 **Agent Management**
- View your recent agent runs in a dedicated sidebar
- Create new agents with custom prompts
- Monitor agent status with real-time updates
- Open agent runs in your browser

🔐 **Authentication**
- Secure token-based authentication
- Organization support
- Easy login/logout commands

⚡ **Real-time Updates**
- Auto-refresh agent runs every 30 seconds
- Manual refresh capability
- Status indicators with color coding

## Installation

1. Install the extension from the VSCode Marketplace (coming soon)
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run `Codegen: Login` to authenticate with your Codegen account
4. Start creating and managing agents!

## Usage

### Authentication

1. **Login**: Use `Codegen: Login` command or click the login button in the welcome view
2. **Logout**: Use `Codegen: Logout` command when needed

### Creating Agents

1. Click the "+" button in the Codegen sidebar
2. Enter your agent prompt (e.g., "Fix the bug in the login component")
3. The agent will be created and you can monitor its progress

### Viewing Agent Runs

- All your recent agent runs appear in the Codegen sidebar
- Click on any agent run to open it in your browser
- Status indicators show the current state:
  - 🟢 Complete
  - 🔵 Running (animated)
  - 🔴 Failed
  - 🟡 Pending

## Configuration

You can customize the extension behavior in VSCode settings:

```json
{
  "codegen.apiEndpoint": "https://api.codegen.com",
  "codegen.autoRefresh": true,
  "codegen.refreshInterval": 30
}
```

## Commands

- `Codegen: Login` - Authenticate with Codegen
- `Codegen: Logout` - Sign out from Codegen
- `Codegen: Show Agent Runs` - Open the Codegen sidebar
- `Codegen: Create New Agent` - Create a new agent with a prompt
- `Codegen: Refresh Agent Runs` - Manually refresh the agent list

## Requirements

- VSCode 1.74.0 or higher
- A Codegen account ([sign up at codegen.com](https://codegen.com))
- API token from your Codegen dashboard

## Development

### Local Development Setup

Most people will use this extension in development mode. Here's how to set it up:

#### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [VSCode](https://code.visualstudio.com/)
- A [Codegen](https://codegen.com) account

#### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/codegen-sh/codegen-ide.git
   cd codegen-ide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Open in VSCode**
   ```bash
   code .
   ```

4. **Launch Extension Development Host**
   - **Important**: Make sure you have `src/extension.ts` open in the editor
   - Press `F5` or go to Run → Start Debugging
   - This opens a new VSCode window with the extension loaded
   - You can also use `Ctrl+Shift+P` → "Debug: Start Debugging"

5. **Test the extension**
   - In the new VSCode window, open the Command Palette (`Ctrl+Shift+P`)
   - Run `Codegen: Login` to authenticate
   - The Codegen sidebar should appear in the Activity Bar

#### Development Workflow

- **Hot Reload**: The extension automatically reloads when you make changes
- **Debugging**: Set breakpoints in your TypeScript code and they'll work in the Extension Development Host
- **Console Logs**: Check the Debug Console in the main VSCode window for extension logs
- **Restart Extension**: Use `Ctrl+Shift+P` → "Developer: Reload Window" in the Extension Development Host

#### Available Scripts

```bash
# Compile TypeScript (one-time)
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run tests
npm test

# Lint code
npm run lint

# Package extension for distribution
npm run package
```

#### VSCode Launch Configurations

The project includes pre-configured launch settings in `.vscode/launch.json`:

- **Run Extension**: Launches the extension in a new VSCode window
- **Extension Tests**: Runs the test suite
- **Attach to Extension Host**: For debugging running extensions

#### Debugging Tips

1. **If F5 fails**: Make sure you have `src/extension.ts` open and run `npm run compile` first
2. **Extension Host Logs**: Check the Output panel → "Log (Extension Host)"
3. **Developer Tools**: Use `Help → Toggle Developer Tools` in the Extension Development Host
4. **Reload Extension**: `Ctrl+R` in the Extension Development Host to reload after changes
5. **TypeScript Errors**: Run `npm run compile` to check for compilation issues

### Building from Source

```bash
# Full build process
npm install
npm run compile
npm test
npm run package
```

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.codegen.com)
- 💬 [Discord Community](https://discord.gg/codegen)
- 🐛 [Report Issues](https://github.com/codegen-sh/codegen-ide/issues)
- 📧 [Email Support](mailto:support@codegen.com)

---

Made with ❤️ by the amazing [Codegen](https://codegen.com) team

## Quick Start

1. Install the extension from the VSCode Marketplace
2. Run `Codegen: Login` from the Command Palette
3. Start creating agents from the sidebar!
