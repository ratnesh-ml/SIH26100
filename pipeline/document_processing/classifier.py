"""Document Classifier taxonomy and interface."""

from dataclasses import dataclass
from enum import Enum


class DocumentType(str, Enum):
    GST_CERT = "GST_CERT"
    PAN_CARD = "PAN_CARD"
    UDYAM_CERT = "UDYAM_CERT"
    CA_TURNOVER_CERT = "CA_TURNOVER_CERT"
    AUDITED_FINANCIALS = "AUDITED_FINANCIALS"
    ITR_ACK = "ITR_ACK"
    OEM_AUTH = "OEM_AUTH"
    INTEGRITY_PACT = "INTEGRITY_PACT"
    MII_DECLARATION = "MII_DECLARATION"
    LAND_BORDER_DECL = "LAND_BORDER_DECL"
    EMD_PROOF = "EMD_PROOF"
    WORK_ORDER = "WORK_ORDER"
    BANK_DETAILS = "BANK_DETAILS"
    TECH_COMPLIANCE = "TECH_COMPLIANCE"
    UNKNOWN = "UNKNOWN"


@dataclass
class ClassificationResult:
    doc_type: DocumentType
    confidence: float
    source: str  # 'rule' | 'model' | 'officer'


class DocumentClassifier:
    """Classifies documents into the 13 canonical CPCL document types."""

    def classify(self, filename: str, first_page_text: str) -> ClassificationResult:
        raise NotImplementedError("Classification logic will be implemented in future phase")
