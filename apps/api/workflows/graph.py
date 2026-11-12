import logging
from typing import Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from apps.api.workflows.state import ConsultationGraphState
from apps.api.workflows.nodes.fact_extractor import extract_clinical_facts_node
from apps.api.workflows.nodes.patient_context import retrieve_patient_context_node
from apps.api.workflows.nodes.question_router import route_doctor_question_node
from apps.api.workflows.nodes.clinical_assistant import clinical_assistant_node
from apps.api.workflows.nodes.safety_validator import clinical_safety_validator_node
from apps.api.workflows.nodes.report_generator import generate_doctor_report_node
from apps.api.workflows.nodes.patient_summary import generate_patient_summary_node

logger = logging.getLogger("consultation_graph")


def supervisor_router(state: ConsultationGraphState) -> Literal["fact_extractor", "question_router", "report_generator"]:
    action = state.get("action", "process_turn")
    if action == "doctor_question":
        return "question_router"
    elif action == "generate_reports":
        return "report_generator"
    return "fact_extractor"


def build_consultation_graph():
    builder = StateGraph(ConsultationGraphState)

    # 1. Register all nodes
    builder.add_node("fact_extractor", extract_clinical_facts_node)
    builder.add_node("patient_context", retrieve_patient_context_node)
    builder.add_node("question_router", route_doctor_question_node)
    builder.add_node("clinical_assistant", clinical_assistant_node)
    builder.add_node("safety_validator", clinical_safety_validator_node)
    builder.add_node("report_generator", generate_doctor_report_node)
    builder.add_node("patient_summary", generate_patient_summary_node)

    # 2. Supervisor routing from START
    builder.add_conditional_edges(
        START,
        supervisor_router,
        {
            "fact_extractor": "fact_extractor",
            "question_router": "question_router",
            "report_generator": "report_generator",
        },
    )

    # 3. Workflow A: Background Turn Processing
    # fact_extractor -> safety_validator -> END
    builder.add_edge("fact_extractor", "safety_validator")
    builder.add_edge("safety_validator", END)

    # 4. Workflow B: Doctor Question Assistant
    # question_router -> clinical_assistant -> END
    builder.add_edge("question_router", "clinical_assistant")
    builder.add_edge("clinical_assistant", END)

    # 5. Workflow C: Dual Report Generation
    # report_generator -> patient_summary -> END
    builder.add_edge("report_generator", "patient_summary")
    builder.add_edge("patient_summary", END)

    # Checkpointer
    checkpointer = MemorySaver()
    return builder.compile(checkpointer=checkpointer)


consultation_graph = build_consultation_graph()
