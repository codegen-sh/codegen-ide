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

### Building from Source

```bash
# Clone the repository
git clone https://github.com/codegen-sh/codegen-ide.git
cd codegen-ide

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
npm run watch
```

### Testing

```bash
npm test
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

Made with ❤️ by the [Codegen](https://codegen.com) team

## Quick Start

1. Install the extension from the VSCode Marketplace
2. Run `Codegen: Login` from the Command Palette
3. Start creating agents from the sidebar!
