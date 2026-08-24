import os
import torch
import logging
from functools import lru_cache
from threading import Lock
from typing import List, Dict, Any
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langchain_core.embeddings import Embeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Import database models
from app.models.telemetry import TelemetryLog
from app.models.alert import Alert

# Set up logging for LangGraph flow
logger = logging.getLogger("langgraph_workflow")
logger.setLevel(logging.INFO)

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
    
    haas_query: str
    fanuc_query: str
    cnc_sop_query: str
    
    # Final output
    final_diagnosis: str

EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
EMBEDDING_WARMUP_QUERY = "search_query: CNC machine maintenance diagnostics"


class SynchronizedEmbeddings(Embeddings):
    """Serialize access to one shared local model while leaving I/O parallel."""

    def __init__(self, delegate: HuggingFaceEmbeddings):
        self._delegate = delegate
        self._lock = Lock()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        with self._lock:
            return self._delegate.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        with self._lock:
            return self._delegate.embed_query(text)


@lru_cache(maxsize=1)
def get_embeddings() -> Embeddings:
    """Create one process-wide embedding model and reuse it for every retriever."""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info("Loading shared embedding model '%s' on %s", EMBEDDING_MODEL_NAME, device)
    return SynchronizedEmbeddings(
        HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": device, "trust_remote_code": True},
            encode_kwargs={"normalize_embeddings": True}
        )
    )


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    """Create one process-wide Pinecone store backed by the shared embeddings."""
    return PineconeVectorStore(
        index_name=os.environ.get("PINECONE_INDEX_NAME", "cnc-manuals"),
        embedding=get_embeddings(),
        pinecone_api_key=os.environ.get("PINECONE_API_KEY"),
        namespace=os.environ.get("PINECONE_NAMESPACE", "cnc-books")
    )


def initialize_retrieval_service() -> None:
    """Load and warm the shared retrieval dependencies during API startup."""
    logger.info("Initializing shared retrieval service")
    embeddings = get_embeddings()
    embeddings.embed_query(EMBEDDING_WARMUP_QUERY)
    get_vector_store()
    logger.info("Shared retrieval service is ready")

# Using Gemini model (reads GOOGLE_API_KEY or GEMINI_API_KEY from environment)
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0.2,
    google_api_key=api_key
)

# ==========================================
# 3. Node Functions
# ==========================================

def fetch_sql_context(state: MultiAgentDiagnosticState, db_session: Session) -> Dict[str, Any]:
    """Queries Postgres for active alert and the last 20 rows of telemetry trends."""
    print("\n" + "="*70, flush=True)
    print(f"[LANGGRAPH FLOW] ---> ENTERING NODE: fetch_sql_context", flush=True)
    logger.info("Executing Node: fetch_sql_context")
    
    machine_id = state["machine_id"]
    print(f"[LANGGRAPH LOG] Fetching SQL telemetry trend & alerts for Machine ID: '{machine_id}'", flush=True)
    
    # 1. Fetch latest active alert
    latest_alert = (
        db_session.query(Alert)
        .filter(Alert.machine_id == machine_id)
        .order_by(desc(Alert.timestamp))
        .first()
    )
    failure_type = latest_alert.reason if latest_alert else "Manual Inspection / Performance Anomaly"
    print(f"[LANGGRAPH LOG] Detected Failure Type / Alert: '{failure_type}'", flush=True)

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
    print(f"[LANGGRAPH LOG] Fetched {len(telemetry_window)} telemetry trend rows from Postgres.", flush=True)

    print(f"[LANGGRAPH FLOW] <--- EXITING NODE: fetch_sql_context", flush=True)
    print("="*70 + "\n", flush=True)

    return {
        "failure_type": failure_type,
        "telemetry_window": telemetry_window
    }


def generate_dynamic_query(state: MultiAgentDiagnosticState, manual_context: str) -> str:
    """Uses LLM to dynamically generate an optimized search query based on current failure context."""
    failure_type = state.get('failure_type', 'Unknown')
    user_query = state.get('user_query', '')
    
    prompt = f"""
You are an AI generating a precise search query for a vector database of technical manuals.
The current machine failure type / alert is: {failure_type}
The user's specific inquiry is: "{user_query}"

We need to search the "{manual_context}" for relevant context.
Generate a concise, highly relevant search query (3-8 keywords) tailored to this specific manual.
Do NOT use quotes, prefixes, or any extra text. Just output the keywords.
"""
    try:
        response = llm.invoke(prompt)
        if isinstance(response.content, str):
            query_text = response.content.strip()
        elif isinstance(response.content, list):
            query_text = "".join([c.get("text", str(c)) if isinstance(c, dict) else str(c) for c in response.content]).strip()
        else:
            query_text = str(response.content).strip()
    except Exception as e:
        logger.error(f"Error generating dynamic query with LLM: {e}")
        print(f"[LANGGRAPH LOG] LLM Query Generation Error: {e}", flush=True)
        query_text = f"{failure_type} {user_query}".strip()
        
    final_query = f"search_query: {query_text}"
    return final_query


def rag_haas_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves mechanical service procedures from Haas VF Service Manual."""
    print("\n" + "="*70, flush=True)
    print(f"[LANGGRAPH FLOW] ---> ENTERING NODE: rag_haas_expert", flush=True)
    logger.info("Executing Node: rag_haas_expert")
    
    query = generate_dynamic_query(state, "Haas VF Service Manual (Mechanical Diagnostics)")
    print(f"[LANGGRAPH LOG] Generated Haas Search Query: '{query}'", flush=True)
    
    try:
        docs = get_vector_store().similarity_search(
            query, 
            k=2, 
            filter={"book_id": "vf_service_manual"}
        )
        print(f"[LANGGRAPH LOG] Retrieved {len(docs)} documents from Pinecone (book_id: 'vf_service_manual')", flush=True)
        for idx, doc in enumerate(docs):
            snippet = doc.page_content.replace("search_document: ", "").replace("\n", " ")[:120]
            print(f"  [Doc {idx+1}] Source: {doc.metadata.get('source_file', 'unknown')} | Snippet: {snippet}...", flush=True)
            
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        logger.error(f"Error querying Haas manual index: {e}")
        print(f"[LANGGRAPH ERROR] Could not query Haas manual index: {e}", flush=True)
        context = f"Notice: Could not query Haas manual index ({str(e)})"
        
    res_context = context if context else "No Haas mechanical manual entries found."
    print(f"[LANGGRAPH FLOW] <--- EXITING NODE: rag_haas_expert | Context length: {len(res_context)} chars", flush=True)
    print("="*70 + "\n", flush=True)
    
    return {
        "haas_manual_context": res_context,
        "haas_query": query
    }


def rag_fanuc_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves electrical/drive alarm codes from Fanuc Spindle Alarm List."""
    print("\n" + "="*70, flush=True)
    print(f"[LANGGRAPH FLOW] ---> ENTERING NODE: rag_fanuc_expert", flush=True)
    logger.info("Executing Node: rag_fanuc_expert")
    
    query = generate_dynamic_query(state, "Fanuc Spindle Alarm List (Electrical & Drive Codes)")
    print(f"[LANGGRAPH LOG] Generated Fanuc Search Query: '{query}'", flush=True)
    
    try:
        docs = get_vector_store().similarity_search(
            query, 
            k=2, 
            filter={"book_id": "fanuc_spindle_alarm_list"}
        )
        print(f"[LANGGRAPH LOG] Retrieved {len(docs)} documents from Pinecone (book_id: 'fanuc_spindle_alarm_list')", flush=True)
        for idx, doc in enumerate(docs):
            snippet = doc.page_content.replace("search_document: ", "").replace("\n", " ")[:120]
            print(f"  [Doc {idx+1}] Source: {doc.metadata.get('source_file', 'unknown')} | Snippet: {snippet}...", flush=True)
            
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        logger.error(f"Error querying Fanuc alarm list index: {e}")
        print(f"[LANGGRAPH ERROR] Could not query Fanuc alarm list index: {e}", flush=True)
        context = f"Notice: Could not query Fanuc alarm list index ({str(e)})"

    res_context = context if context else "No Fanuc alarm codes found matching this condition."
    print(f"[LANGGRAPH FLOW] <--- EXITING NODE: rag_fanuc_expert | Context length: {len(res_context)} chars", flush=True)
    print("="*70 + "\n", flush=True)

    return {
        "fanuc_alarm_context": res_context,
        "fanuc_query": query
    }


def rag_sop_expert(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Retrieves standard operating procedures and safety protocols from CNC Lathe SOP."""
    print("\n" + "="*70, flush=True)
    print(f"[LANGGRAPH FLOW] ---> ENTERING NODE: rag_sop_expert", flush=True)
    logger.info("Executing Node: rag_sop_expert")
    
    query = generate_dynamic_query(state, "CNC Lathe Factory SOP (Safety & Operating Protocols)")
    print(f"[LANGGRAPH LOG] Generated CNC SOP Search Query: '{query}'", flush=True)
    
    try:
        docs = get_vector_store().similarity_search(
            query, 
            k=2, 
            filter={"book_id": "cnc_lathe"}
        )
        print(f"[LANGGRAPH LOG] Retrieved {len(docs)} documents from Pinecone (book_id: 'cnc_lathe')", flush=True)
        for idx, doc in enumerate(docs):
            snippet = doc.page_content.replace("search_document: ", "").replace("\n", " ")[:120]
            print(f"  [Doc {idx+1}] Source: {doc.metadata.get('source_file', 'unknown')} | Snippet: {snippet}...", flush=True)
            
        context = "\n---\n".join([d.page_content.replace("search_document: ", "") for d in docs])
    except Exception as e:
        logger.error(f"Error querying CNC SOP index: {e}")
        print(f"[LANGGRAPH ERROR] Could not query CNC SOP index: {e}", flush=True)
        context = f"Notice: Could not query CNC SOP index ({str(e)})"

    res_context = context if context else "No specific safety SOP guidelines retrieved."
    print(f"[LANGGRAPH FLOW] <--- EXITING NODE: rag_sop_expert | Context length: {len(res_context)} chars", flush=True)
    print("="*70 + "\n", flush=True)

    return {
        "cnc_sop_context": res_context,
        "cnc_sop_query": query
    }


def generate_diagnosis(state: MultiAgentDiagnosticState) -> Dict[str, Any]:
    """Synthesizes SQL telemetry trend + knowledge from all 3 books into final answer."""
    print("\n" + "="*70, flush=True)
    print(f"[LANGGRAPH FLOW] ---> ENTERING NODE: generate_diagnosis", flush=True)
    logger.info("Executing Node: generate_diagnosis")
    
    print(f"[LANGGRAPH LOG] Synthesizing Diagnosis Input State:", flush=True)
    print(f"  - Machine ID: {state.get('machine_id')}", flush=True)
    print(f"  - Failure Type: {state.get('failure_type')}", flush=True)
    print(f"  - Telemetry Window Count: {len(state.get('telemetry_window', []))}", flush=True)
    print(f"  - Haas Query: {state.get('haas_query')}", flush=True)
    print(f"  - Fanuc Query: {state.get('fanuc_query')}", flush=True)
    print(f"  - SOP Query: {state.get('cnc_sop_query')}", flush=True)
    
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

    print(f"[LANGGRAPH LOG] LLM Completion Output Generated (Length: {len(diagnosis_str)} chars)", flush=True)
    print(f"[LANGGRAPH FLOW] <--- EXITING NODE: generate_diagnosis", flush=True)
    print("="*70 + "\n", flush=True)

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
