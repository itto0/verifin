import re
from typing import List, Tuple
from app.schemas.common import Finding
from app.schemas.voice import AudioSegment, ScriptCheckItem, TranscriptionResult, VoiceQAResult
from app.services.audio_engine import detect_hesitation_pauses

OJK_STAGES = [
    {
        "stage": "1. GREETING & IDENTITY",
        "description": "Agent states official greeting and company identity (BAF / PT Bussan Auto Finance)",
        "patterns": [r"baf\b", r"bussan auto finance", r"selamat (pagi|siang|sore)", r"dengan saya"],
    },
    {
        "stage": "2. PURPOSE & RECORDING DISCLOSURE",
        "description": "Agent discloses call purpose and mandatory recording notice",
        "patterns": [r"direkam", r"rekaman", r"verifikasi", r"pengajuan", r"pembiayaan"],
    },
    {
        "stage": "3. DATA CONFIRMATION",
        "description": "Confirmation of customer identity, birthdate, or collateral",
        "patterns": [r"konfirmasi", r"nama", r"tanggal lahir", r"unit", r"motor", r"jaminan"],
    },
    {
        "stage": "4. CLOSING STATEMENT",
        "description": "Professional closing thanking the customer",
        "patterns": [r"terima kasih", r"selamat beraktivitas", r"selamat (pagi|siang|sore)"],
    },
]


def audit_script_compliance(segments: List[AudioSegment]) -> List[ScriptCheckItem]:
    """Audits agent utterances against OJK / BAF standard tele-verification stages."""
    agent_texts = [s.text for s in segments if s.speaker in ["agent", "unknown"]]
    full_agent_text = " ".join(agent_texts).lower()

    checklist: List[ScriptCheckItem] = []
    for item in OJK_STAGES:
        matches = [p for p in item["patterns"] if re.search(p, full_agent_text)]
        passed = len(matches) >= 1
        matched_sample = None
        if passed:
            for text in agent_texts:
                if any(re.search(p, text.lower()) for p in item["patterns"]):
                    matched_sample = text
                    break

        checklist.append(
            ScriptCheckItem(
                stage=item["stage"],
                description=item["description"],
                passed=passed,
                matched_utterance=matched_sample,
            )
        )
    return checklist


def calculate_voice_qa(segments: List[AudioSegment]) -> Tuple[VoiceQAResult, List[Finding]]:
    """Calculates composite QA compliance score (0-100) and aggregates findings."""
    checklist = audit_script_compliance(segments)
    hesitation_findings = detect_hesitation_pauses(segments)

    passed_count = sum(1 for c in checklist if c.passed)
    stage_score = (passed_count / len(checklist)) * 70.0 if checklist else 0.0  # Up to 70% from script adherence

    # Hesitation deductions (up to 30% penalty)
    hesitation_count = len(hesitation_findings)
    hesitation_penalty = min(hesitation_count * 5.0, 30.0)

    if not segments:
        final_qa_score = 0.0
    else:
        final_qa_score = max(0.0, min(100.0, stage_score + (30.0 - hesitation_penalty)))

    all_findings = list(hesitation_findings)
    for c in checklist:
        if not c.passed:
            all_findings.append(
                Finding(
                    type="SCRIPT_STAGE_MISSED",
                    severity="high" if "RECORDING" in c.stage else "medium",
                    description=f"OJK compliance stage not fulfilled: {c.stage} - {c.description}",
                )
            )

    full_txt = " ".join([s.text for s in segments])
    duration = segments[-1].end if segments else 0.0

    qa_result = VoiceQAResult(
        transcription=TranscriptionResult(
            language="id",
            duration=duration,
            full_transcript=full_txt,
            segments=segments,
        ),
        qa_score=round(final_qa_score, 1),
        script_adherence=checklist,
        hesitation_count=hesitation_count,
    )
    return qa_result, all_findings
