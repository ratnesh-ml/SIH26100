"""Comprehensive Tests for the Evidence Model, Provenance Traces, and Bounding Box Packaging."""

import pytest

from pipeline.evidence.highlighter import (
    BoundingBox,
    EvidenceItem,
    EvidencePackager,
    EvidenceRecord,
    EvidenceTrace,
)


@pytest.fixture
def packager():
    return EvidencePackager()


# =========================================================================
# 1. BoundingBox Contract and Responsive Calculations
# =========================================================================

def test_bounding_box_coordinates_and_dict():
    bbox = BoundingBox(x0=72.0, y0=144.0, x1=288.0, y1=160.0)
    assert bbox.x0 == 72.0
    assert bbox.y0 == 144.0
    assert bbox.x1 == 288.0
    assert bbox.y1 == 160.0

    d = bbox.to_dict()
    assert d == {"x0": 72.0, "y0": 144.0, "x1": 288.0, "y1": 160.0}

    rebuilt = BoundingBox.from_dict(d)
    assert rebuilt.x0 == bbox.x0
    assert rebuilt.x1 == bbox.x1


def test_bounding_box_to_percentages_standard_a4():
    """Convert absolute point coordinates (595 x 842 A4) to responsive CSS percentages."""
    bbox = BoundingBox(x0=59.5, y0=84.2, x1=297.5, y1=168.4)
    percentages = bbox.to_percentages(page_width=595.0, page_height=842.0)

    # 59.5 / 595 = 10%
    assert percentages["left"] == 10.0
    # 84.2 / 842 = 10%
    assert percentages["top"] == 10.0
    # (297.5 - 59.5) / 595 = 238 / 595 = 40%
    assert percentages["width"] == 40.0
    # (168.4 - 84.2) / 842 = 84.2 / 842 = 10%
    assert percentages["height"] == 10.0


def test_bounding_box_zero_division_guard():
    """Ensure zero or negative page dimensions return safe zeros without raising exception."""
    bbox = BoundingBox(x0=10.0, y0=10.0, x1=20.0, y1=20.0)
    zero_pct = bbox.to_percentages(page_width=0.0, page_height=0.0)
    assert zero_pct == {"left": 0.0, "top": 0.0, "width": 0.0, "height": 0.0}


# =========================================================================
# 2. EvidenceItem Contract & Provenance Attributes
# =========================================================================

def test_evidence_item_full_contract():
    """Verify all 8 required provenance fields: document, page, field, quote, bbox, source, method, confidence."""
    bbox = BoundingBox(x0=100.0, y0=200.0, x1=350.0, y1=225.0)
    item = EvidenceItem(
        document="GST_REG_06_Certificate.pdf",
        page=1,
        field="gstin",
        quote="Registration Number : 33AABCC1234F1Z5",
        bounding_box=bbox,
        source="document_text_layer",
        method="anchor_regex",
        confidence=0.98,
        metadata={"mod36_valid": True},
    )

    # Contract verification
    assert item.document == "GST_REG_06_Certificate.pdf"
    assert item.page == 1
    assert item.field == "gstin"
    assert item.quote == "Registration Number : 33AABCC1234F1Z5"
    assert item.bounding_box is not None
    assert item.source == "document_text_layer"
    assert item.method == "anchor_regex"
    assert item.confidence == 0.98

    # Alias / backward compatibility
    assert item.page_no == 1
    assert item.document_id == "GST_REG_06_Certificate.pdf"
    assert item.bbox == bbox.to_dict()

    d = item.to_dict()
    assert d["document"] == "GST_REG_06_Certificate.pdf"
    assert d["page"] == 1
    assert d["field"] == "gstin"
    assert d["quote"] == "Registration Number : 33AABCC1234F1Z5"
    assert d["bounding_box"] == bbox.to_dict()
    assert d["source"] == "document_text_layer"
    assert d["method"] == "anchor_regex"
    assert d["confidence"] == 0.98


def test_evidence_record_alias():
    """Verify EvidenceRecord alias works identically to EvidenceItem."""
    record = EvidenceRecord(
        document="PAN_Card.pdf",
        page=1,
        field="pan",
        quote="AABCC1234F",
    )
    assert record.document == "PAN_Card.pdf"
    assert record.field == "pan"
    assert record.source == "document_text_layer"


# =========================================================================
# 3. Multi-Document Provenance Tracing ("Show me where this came from")
# =========================================================================

def test_evidence_trace_single_document():
    trace = EvidenceTrace(
        finding_id="FIND-TURN-01",
        title="Turnover Threshold Assessment",
        status="PASS",
        explanation="Average turnover INR 18.5 Cr satisfies mandatory requirement of INR 13.5 Cr.",
    )
    item = EvidenceItem(
        document="CA_Turnover_Certificate.pdf",
        page=1,
        field="average_turnover_inr",
        quote="Average Annual Turnover: Rs 18,50,00,000",
        source="document_text_layer",
        method="ca_cert_anchor",
        confidence=0.99,
    )
    trace.add_evidence(item)

    assert len(trace.items) == 1
    assert trace.is_multi_document is False
    summary = trace.get_provenance_summary()
    assert "CA_Turnover_Certificate.pdf" in summary
    assert "p.1" in summary
    assert "[average_turnover_inr]" in summary


def test_evidence_trace_multi_document_cross_verification():
    """Verify cross-document verification findings spanning GST Certificate and PAN Card."""
    trace = EvidenceTrace(
        finding_id="FIND-XB-02",
        title="PAN embedded in GSTIN parity check",
        status="PASS",
        explanation="Characters 3–12 of GSTIN (AABCC1234F) match PAN card exactly.",
    )

    gst_evidence = EvidenceItem(
        document="GST_REG_06.pdf",
        page=1,
        field="gstin",
        quote="33AABCC1234F1Z5",
        bounding_box=BoundingBox(100.0, 150.0, 300.0, 170.0),
        source="document_text_layer",
        method="anchor_regex",
        confidence=0.98,
    )
    pan_evidence = EvidenceItem(
        document="PAN_Card.pdf",
        page=1,
        field="pan",
        quote="AABCC1234F",
        bounding_box=BoundingBox(80.0, 220.0, 240.0, 245.0),
        source="document_ocr",
        method="tesseract_ocr",
        confidence=0.92,
    )

    trace.add_evidence(gst_evidence)
    trace.add_evidence(pan_evidence)

    assert len(trace.items) == 2
    assert trace.is_multi_document is True
    prov = trace.get_provenance_summary()
    assert "GST_REG_06.pdf" in prov
    assert "PAN_Card.pdf" in prov
    assert "document_text_layer" in prov
    assert "document_ocr" in prov


# =========================================================================
# 4. EvidencePackager UI Overlay Rendering
# =========================================================================

def test_evidence_packager_produces_ui_package(packager):
    """Verify packager creates responsive overlay coordinates and confidence highlight style."""
    packaged = packager.package_evidence(
        document_name="Udyam_Registration.pdf",
        page_no=1,
        field_name="udyam_number",
        quote="UDYAM-TN-01-0012345",
        bbox={"x0": 59.5, "y0": 168.4, "x1": 357.0, "y1": 210.5},
        source="document_text_layer",
        method="anchor_regex",
        confidence=0.95,
        page_width=595.0,
        page_height=842.0,
    )

    assert packaged["document"] == "Udyam_Registration.pdf"
    assert packaged["page"] == 1
    assert packaged["field"] == "udyam_number"
    assert packaged["quote"] == "UDYAM-TN-01-0012345"
    assert "overlay" in packaged

    overlay = packaged["overlay"]
    assert overlay["percentages"]["left"] == 10.0
    assert overlay["percentages"]["top"] == 20.0
    assert overlay["highlight_style"] == "solid"  # >= 0.85


def test_evidence_packager_low_confidence_dashed_style(packager):
    """Confidence < 0.85 gets dashed highlight style for visual review."""
    packaged = packager.package_evidence(
        document_name="Scanned_Turnover.pdf",
        page_no=2,
        field_name="turnover_fy24",
        quote="12,50,00,000",
        bbox=BoundingBox(50.0, 50.0, 200.0, 100.0),
        source="document_ocr",
        method="tesseract_ocr",
        confidence=0.78,  # Moderate confidence
    )
    assert packaged["overlay"]["highlight_style"] == "dashed"


# =========================================================================
# 5. Traceability Across All Subsystems
# =========================================================================

def test_traceability_from_anomaly_to_evidence():
    """Verify forensic anomaly maps to evidence item."""
    item = EvidenceItem(
        document="GST_REG_06.pdf",
        page=1,
        field="producer",
        quote=None,
        source="pdf_metadata",
        method="producer_analysis",
        confidence=0.95,
        metadata={"producer": "GIMP 2.10.32", "anomaly_code": "A-PDF-03"},
    )
    assert item.field == "producer"
    assert item.source == "pdf_metadata"
    assert item.metadata["anomaly_code"] == "A-PDF-03"


def test_traceability_from_registry_to_evidence():
    """Verify simulated government registry verification maps to evidence item."""
    item = EvidenceItem(
        document="GSTN_Portal",
        page=1,
        field="gstin_status",
        quote="Active",
        source="simulated_registry",
        method="api_lookup",
        confidence=1.0,
        metadata={"gstin": "33AABCC1234F1Z5", "taxpayer_type": "Regular"},
    )
    assert item.source == "simulated_registry"
    assert item.quote == "Active"
    assert item.confidence == 1.0
