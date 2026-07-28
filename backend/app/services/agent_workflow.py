import os
import torch
from typing import List, Dict, Any
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Import your database model
from app.models.telemetry import TelemetryLog
from app.models.alert import Alert

# ==========================================
# 1. State Definition
# ==========================================
class MultiAgentDiagnosticState(TypedDict):
    machine_id: str
    user_query: str
    failure_type: str
    telemetry_window: List[Dict[str, Any]]
    
    # Sub-agent outputs
    haas_manual_context: str
    fanuc_alarm_context: str
    cnc_sop_context: str
    
    # Final output
    final_diagnosis: str

def get_vector_store():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    embeddings = HuggingFaceEmbeddings(
        model_name="nomic-ai/nomic-embed-text-v1.5",
        model_kwargs={"device": device, "trust_remote_code": True},
        encode_kwargs={"normalize_embeddings": True}
    )
    return PineconeVectorStore(
        index_name=os.environ.get("PINECONE_INDEX_NAME", "factory-manuals"),
        embedding=embeddings,
        pinecone_api_key=os.environ.get("PINECONE_API_KEY")
    )

# Using Gemini model (reads GOOGLE_API_KEY or GEMINI_API_KEY from environment)
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    temperature=0.2,
    google_api_key=api_key
)

# ==========================================
# 3. Node Functions
# ==========================================

def fetch_sql_context(state: MultiAgentDiagnosticState, db_session: Session) -> Dict[str, Any]:
    """Queries Postgres for active alert and the last 20 rows of telemetry trends."""
    machine_id = state["machine_id"]
    
    # 1. Fetch latest active alert
    latest_alert = (
        db_session.query(Alert)
        .filter(Alert.machine_id == machine_id)
        .order_by(desc(Alert.timestamp))
        .first()
    )
    failure_type = latest_alert.reason if latest_alert else "Manual Inspection / Performance Anomaly"

    # 2. Fetch last 20 telemetry rows (Sliding Window Trend)
    logs = (
        db_session.query(TelemetryLog)
        .filter(TelemetryLog.machine_id == machine_id)
        .order_by(desc(TelemetryLog.timestamp))
        .limit(20)
        .all()
    )
    
    # Reverse so time flows forward (oldest -> newest)
    logs.reverse()
    
    telemetry_window = [
        {
            "timestamp": log.timestamp.strftime("%H:%M:%S"),
            "rpm": log.rpm,
            "torque_nm": log.torque_nm,
            "air_temp_k": log.air_temp_k,
            "process_temp_k": log.process_temp_k,
            "tool_wear_min": log.tool_wear_min
        }
        for log in logs
    ]

    return {
        "failure_type": failure_type,
        "telemetry_window": telemetry_window
    }


def rag_haas_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves mechanical service procedures from Haas VF Service Manual."""
    query = f"search_query: {state['failure_type']} mechanical repair spindle alignment tool wear"
    
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(
            query, 
            k=2, 
            filter={"book_id": "vf_service_manual"}
        )
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        context = f"Notice: Could not query Haas manual index ({str(e)})"
        
    return {"haas_manual_context": context if context else "No Haas mechanical manual entries found."}


def rag_fanuc_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves electrical/drive alarm codes from Fanuc Spindle Alarm List."""
    query = f"search_query: {state['failure_type']} spindle alarm electrical code overstrain power"
    
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(
            query, 
            k=2, 
            filter={"book_id": "fanuc_spindle_alarm_list"}
        )
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        context = f"Notice: Could not query Fanuc alarm list index ({str(e)})"

    return {"fanuc_alarm_context": context if context else "No Fanuc alarm codes found matching this condition."}


def rag_sop_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves standard operating procedures and safety protocols from CNC Lathe SOP."""
    query = f"search_query: {state['failure_type']} safety lock out emergency stop operator protocol"
    
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(
            query, 
            k=2, 
            filter={"book_id": "cnc_lathe"}
        )
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        context = f"Notice: Could not query CNC SOP index ({str(e)})"

    return {"cnc_sop_context": context if context else "No specific safety SOP guidelines retrieved."}


def generate_diagnosis(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Synthesizes SQL telemetry trend + knowledge from all 3 books into final answer."""
    prompt = f"""
You are a Lead Reliability & Diagnostics Engineer managing factory assets.
A machine failure event has occurred on Asset: {state['machine_id']}.

PRIMARY ALERT / FAILURE TYPE:
{state['failure_type']}

LAST 20 SECONDS TELEMETRY TREND (Oldest -> Newest):
{state['telemetry_window']}

--------------------------------------------------
EXPERT KNOWLEDGE RETRIEVED FROM MANUALS:

[BOOK 1: HAAS VF SERVICE MANUAL (Mechanical Diagnostics)]
{state['haas_manual_context']}

[BOOK 2: FANUC SPINDLE ALARM LIST (Electrical & Drive Codes)]
{state['fanuc_alarm_context']}

[BOOK 3: CNC LATHE / FACTORY SOP (Safety & Operating Protocols)]
{state['cnc_sop_context']}
--------------------------------------------------

USER INQUIRY:
"{state['user_query']}"

INSTRUCTIONS:
1. Analyze the 20-second telemetry trend. Identify the physical phenomenon (e.g., Torque rising while RPM drops, or temperature spiking).
2. Cross-reference the telemetry trend with the technical excerpts from the 3 manuals above.
3. Provide a clear, highly structured diagnosis with:
   - **Root Cause Analysis:** Explain what physically happened over time based on the telemetry trend.
   - **Manual Cross-Reference:** Reference specific failure modes or alarm codes found in the retrieved excerpts.
   - **3-Step Corrective Action Plan:** Immediate physical steps the operator must take (incorporating safety/SOP protocols).
"""

    response = llm.invoke(prompt)
    if isinstance(response.content, str):
        diagnosis_str = response.content
    elif isinstance(response.content, list):
        diagnosis_str = "".join([c.get("text", str(c)) if isinstance(c, dict) else str(c) for c in response.content])
    else:
        diagnosis_str = str(response.content)

    return {"final_diagnosis": diagnosis_str}

# ==========================================
# 4. LangGraph Graph Assembly
# ==========================================
def build_diagnostic_graph(db_session: Session):
    workflow = StateGraph(MultiAgentDiagnosticState)

    # Bind db_session into fetch_sql_context node
    def sql_node_wrapper(state: MultiAgentDiagnosticState):
        return fetch_sql_context(state, db_session)

    # Add Nodes
    workflow.add_node("fetch_sql_context", sql_node_wrapper)
    workflow.add_node("rag_haas_expert", rag_haas_expert)
    workflow.add_node("rag_fanuc_expert", rag_fanuc_expert)
    workflow.add_node("rag_sop_expert", rag_sop_expert)
    workflow.add_node("generate_diagnosis", generate_diagnosis)

    # Edge 1: Start to SQL node
    workflow.add_edge(START, "fetch_sql_context")

    # Parallel Fan-Out: SQL node triggers all 3 RAG agents simultaneously
    workflow.add_edge("fetch_sql_context", "rag_haas_expert")
    workflow.add_edge("fetch_sql_context", "rag_fanuc_expert")
    workflow.add_edge("fetch_sql_context", "rag_sop_expert")

    # Parallel Fan-In: All 3 RAG agents feed into generate_diagnosis
    workflow.add_edge("rag_haas_expert", "generate_diagnosis")
    workflow.add_edge("rag_fanuc_expert", "generate_diagnosis")
    workflow.add_edge("rag_sop_expert", "generate_diagnosis")

    # Edge Final: Diagnosis to End
    workflow.add_edge("generate_diagnosis", END)

    return workflow.compile()
