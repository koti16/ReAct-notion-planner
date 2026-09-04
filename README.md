# ReAct Notion Planner

An AI-powered planner built with LangGraph, FastAPI, Next.js, and the Notion API that intelligently manages your tasks and calendar using ReAct (Reasoning + Acting) methodology.

## Overview

ReAct Notion Planner combines the power of large language models with structured planning to help you organize, prioritize, and execute your tasks efficiently. The AI agent leverages the ReAct framework to reason about your tasks and take appropriate actions, seamlessly integrating with your Notion workspace and calendar.

## Features

### AI Agent
- Intelligent task analysis and planning powered by LLMs
- Natural language understanding for task interpretation
- Autonomous decision-making capabilities

### ReAct Planning
- **Reasoning**: The AI analyzes your tasks and goals to formulate strategies
- **Acting**: Executes planned actions through API integrations
- Iterative problem-solving approach for complex task management

### Task Management
- Create, update, and organize tasks efficiently
- Automatic task prioritization based on deadlines and importance
- Task dependency tracking and scheduling
- Progress monitoring and status updates

### Notion Integration
- Seamless synchronization with your Notion workspace
- Read and write access to databases and pages
- Real-time updates and bidirectional sync
- Support for custom properties and workflows

### Calendar Integration
- Automatically schedule tasks on your calendar
- Detect calendar conflicts and optimize scheduling
- Integrate with major calendar providers
- View and manage task deadlines alongside calendar events

## Tech Stack

- **Backend**: FastAPI (Python) with LangGraph for agent orchestration
- **Frontend**: Next.js (React) for a modern, responsive UI
- **Integrations**: Notion API, Calendar APIs
- **AI Framework**: LLM-based reasoning with ReAct methodology

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- Notion API token
- Calendar API credentials (optional)

### Installation

#### Backend Setup
```bash
git clone https://github.com/koti16/ReAct-notion-planner.git
cd ReAct-notion-planner/backend
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd frontend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory with:
   ```
   NOTION_API_TOKEN=your_notion_token
   CALENDAR_API_KEY=your_calendar_key
   ```

2. Configure frontend environment variables in `.env.local`

### Running the Application

#### Start Backend
```bash
python main.py
```

#### Start Frontend
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Connect Your Notion Workspace**: Authenticate with your Notion account and select databases
2. **Add Tasks**: Create tasks via the web interface or add them to your Notion workspace
3. **Set Preferences**: Configure planning preferences, deadlines, and priorities
4. **Let AI Plan**: The agent will analyze and organize your tasks automatically
5. **Sync Calendar**: Automatically sync scheduled tasks to your calendar

## Architecture

```
┌─────────────┐
│   Frontend  │ (Next.js)
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────┐
│   FastAPI Backend   │
│  + LangGraph Agent  │
└──────┬──────────────┘
       │
       ├─────────────────────┐
       ▼                     ▼
   ┌────────┐          ┌──────────┐
   │ Notion │          │ Calendar │
   │  API   │          │   API    │
   └────────┘          └──────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Planning! 🚀**
