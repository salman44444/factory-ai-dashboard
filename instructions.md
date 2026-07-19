Here is the comprehensive, agent-ready Markdown file. Save it as `PROJECT_BLUEPRINT.md` in the repository root. It includes explicit setup commands, schema definitions, and step-by-step execution prompts tailored for an AI coding assistant.

# Master Project Blueprint: AI-Powered Factory Equipment Monitoring Dashboard

## 1. Project Overview & Objectives
This project is an end-to-end, real-time Human-Machine Interface (HMI) and predictive maintenance system. It simulates industrial machinery telemetry, streams data via WebSockets, and integrates a LangGraph-powered Retrieval-Augmented Generation (RAG) agent. The agent acts as an "on-call engineer," diagnosing real-time anomalies using live database context combined with embedded technical manuals.

**Target Tech Stack:**
- **Backend:** Python 3.11+, FastAPI, Uvicorn, asyncio, WebSockets.
- **AI/RAG:** LangChain, LangGraph, Pinecone (Vector DB), OpenAI/Anthropic API.
- **Database:** PostgreSQL, Drizzle ORM.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts.
- **Data Source:** UCI AI4I 2020 Predictive Maintenance Dataset.

---

## 2. Monorepo Architecture & Directory Structure

Run the following initialization commands before generating code:

```bash
mkdir factory-ai-dashboard && cd factory-ai-dashboard
npm create vite@latest frontend -- --template react-ts
mkdir backend && cd backend && python3 -m venv venv && source venv/bin/activate
```

```text
factory-ai-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application instance & router inclusion
│   │   ├── api/
│   │   │   ├── rest.py             # HTTP endpoints (GET machines, POST chat)
│   │   │   └── websocket.py        # WS endpoint for live telemetry broadcasting
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic BaseSettings (ENV vars)
│   │   │   └── db.py               # Database connection pooling
│   │   ├── models/
│   │   │   ├── schema.ts           # Drizzle ORM schemas (if managed via Node script) or SQLAlchemy models
│   │   │   └── pydantic_models.py  # Data validation schemas
│   │   ├── services/
│   │   │   ├── anomaly_engine.py   # Deterministic threshold checking
│   │   │   └── agent_workflow.py   # LangGraph state machine & LLM orchestration
│   │   └── simulator/
│   │       └── data_streamer.py    # Async script reading ai4i2020.csv and pushing to DB/WS
│   ├── data/
│   │   └── ai4i2020.csv            # Raw dataset
│   ├── docs/
│   │   └── cnc_manual.pdf          # Mock PDF for vector embedding
│   └── requirements.txt            # fastapi, uvicorn, langchain, langgraph, pinecone-client, psycopg2-binary
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChartCard.tsx       # Recharts live line graph wrapper
│   │   │   ├── MetricCard.tsx      # Big number display with conditional red/green text
│   │   │   └── ChatWidget.tsx      # Slide-out LangGraph copilot interface
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts     # Custom hook managing WS connection and payload buffering
│   │   │   └── useChat.ts          # Custom hook managing API calls to POST /api/chat
│   │   ├── pages/
│   │   │   └── Dashboard.tsx       # Main HMI layout
│   │   ├── types/
│   │   │   └── index.ts            # Shared TS interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json                # react, recharts, tailwindcss, lucide-react
│   ├── tailwind.config.js
│   └── vite.config.ts
├── README.md
└── docker-compose.yml              # Local PostgreSQL container definition
```

---

## 3. Database Schema Definitions (Drizzle / PostgreSQL)

### Table 1: `machines`
Tracks the physical assets being monitored.

- `id`: uuid, primary key, default random.
- `name`: varchar, not null (e.g., "CNC-Mill-01").
- `type`: varchar, not null.
- `status`: varchar (enum: 'RUNNING', 'WARNING', 'OFFLINE', 'FAULT'), default 'OFFLINE'.
- `created_at`: timestamp, default now.

### Table 2: `telemetry_logs`
High-frequency insert table for sensor data.

- `id`: uuid, primary key.
- `machine_id`: uuid, foreign key to `machines.id`.
- `timestamp`: timestamptz, not null.
- `air_temp_k`: real.
- `process_temp_k`: real.
- `rpm`: integer.
- `torque_nm`: real.
- `tool_wear_min`: integer.

### Table 3: `alerts`
Triggered by the anomaly detection engine.

- `id`: uuid, primary key.
- `machine_id`: uuid, foreign key to `machines.id`.
- `timestamp`: timestamptz, not null.
- `severity`: varchar (enum: 'LOW', 'MEDIUM', 'CRITICAL').
- `reason`: text (e.g., "Overstrain Failure Risk: High Torque & Low RPM").
- `resolved`: boolean, default false.

---

## 4. API & WebSocket Contracts

### WebSocket: `ws://<host>:8000/ws/live-data`

Pushes data to connected clients natively. No polling.

**Standard Telemetry Payload:**

```json
{
  "event_type": "telemetry",
  "data": {
    "machine_id": "uuid-string",
    "timestamp": "2026-07-18T18:05:00Z",
    "metrics": {
      "air_temp_k": 298.1,
      "process_temp_k": 308.6,
      "rpm": 1492,
      "torque_nm": 42.5,
      "tool_wear_min": 12
    }
  }
}
```

**Alert Payload:**

```json
{
  "event_type": "alert",
  "data": {
    "machine_id": "uuid-string",
    "severity": "CRITICAL",
    "message": "Tool Wear Failure Imminent"
  }
}
```

### REST Endpoints

1. **`GET /api/machines/{machine_id}/history`**
   - Purpose: Populate frontend charts on initial load before WS takes over.
   - Response: Array of the last 100 telemetry JSON objects.

2. **`POST /api/chat`**
   - Purpose: Trigger the LangGraph RAG workflow.
   - Request: `{ "machine_id": "uuid-string", "query": "What do I do about the high torque warning?" }`
   - Response: `{ "reply": "According to the manual, verify the spindle alignment..." }`

---

## 5. Execution Steps for AI Agent

**Agent Instruction:** Execute this project in the following strict phases. Do not move to a new phase until the current one is tested and functional.

### Phase 1: Database & Simulator Foundation

1. Initialize the `docker-compose.yml` with a PostgreSQL 15 image.
2. Set up Drizzle ORM to define the schema and run migrations.
3. Write `simulator/data_streamer.py`. Use `pandas` to load `ai4i2020.csv`. Iterate over the rows using `asyncio.sleep(1.0)`. Generate HTTP POST requests to the backend ingestion route.

### Phase 2: FastAPI Backend & WebSockets

1. Create `main.py` with FastAPI.
2. Build the data ingestion POST route that saves telemetry to PostgreSQL.
3. Build a simple anomaly detection function that checks the incoming payload: If `torque_nm > 60`, generate an alert.
4. Implement the WebSocket `/ws/live-data` route using FastAPI's `WebSocket` class. Use a connection manager to broadcast incoming data from the ingestion route directly to active WS clients.

### Phase 3: React + Vite Frontend (HMI)

1. Set up Tailwind CSS with a dark mode color palette (e.g., Slate-900 background).
2. Create the `useWebSocket.ts` hook to connect to the backend. Maintain a React state array of the last 50 data points.
3. Build the Dashboard layout. Add Recharts `<LineChart>` to render the RPM and Torque data streams natively updating.
4. Build an Alert Banner component that listens for `event_type === "alert"` and displays a red warning div.

### Phase 4: LangGraph Diagnostic Copilot

1. Write a standalone Python script to parse a sample technical PDF (use LangChain's `PyPDFLoader`), chunk it via `RecursiveCharacterTextSplitter`, and upsert to a free Pinecone index.
2. Build `agent_workflow.py`. Define a `StateGraph` with these nodes:
   - `get_sql_context`: Queries the DB for the machine's current metrics and active alerts.
   - `get_vector_context`: Queries Pinecone with the user's prompt.
   - `generate_answer`: Injects both contexts into an LLM system prompt to generate the final response.
3. Expose the compiled LangGraph application via the `POST /api/chat` route.
4. Add a React `ChatWidget` to the frontend side-panel to interface with this route.