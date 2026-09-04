# VigilBid Deterministic Cross-Bidder Link Graph Specification

## 1. Executive Summary

The **VigilBid Cross-Bidder Link Graph** (`pipeline/risk/graph.py`) constructs an explainable, deterministic entity-relationship network connecting bidders participating in the same tender. It replaces opaque Graph Neural Networks (GNNs/GraphSAGE) with a verifiable, legally defensible link analysis based on CVC guidelines on related-party bidding.

```
┌────────────────────────────────────────────────────────┐
│               Bidder Submission Metadata               │
│  - Directors & Key Management Personnel                │
│  - Contact Phone Numbers & Email Addresses             │
│  - Registered Office Addresses & Locations             │
│  - Bank Account & IFSC Identifiers                     │
│  - PDF Author & Creator Metadata Strings               │
│  - PDF Document Generation Timestamps                  │
│  - Document Text SimHash / Shingle Signatures          │
└───────────────────────────┬────────────────────────────┘
                            │ Evaluated by CrossBidderGraphBuilder
                            ▼
┌────────────────────────────────────────────────────────┐
│             NetworkX Link Graph Construction           │
│  - Bidder Nodes + Shared Attribute Connector Nodes     │
│  - Direct Bidder-to-Bidder Collusion Edges             │
│  - Connected Component Collusion Clusters              │
│  - CVC Guideline Related-Party Explanations            │
└───────────────────────────┬────────────────────────────┘
                            │ Exposed via REST APIs
                            ▼
┌────────────────────────────────────────────────────────┐
│           D3 / react-force-graph Visualization         │
│  - Red Edges connecting Colluding Bidders              │
│  - Collusion Cluster Subgraphs                         │
│  - Attribute Node Inspectors                           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Supported Link Signals & Weightings

Per Section 10.2 of `docs/02`:

| Shared Attribute | Node Type | Link Weight | Detection Criteria | CVC Guideline Application |
|---|---|---|---|---|
| **Common Director** | `DIRECTOR` | +15.0 | Exact or normalized match on director name / DIN. | Related-party bidding under common corporate control. |
| **Common Phone Number** | `PHONE` | +15.0 | Identical 10-digit normalized contact telephone. | Common administrative or bid preparation point. |
| **Common Email Address** | `EMAIL` | +15.0 | Shared non-public domain email or identical address. | Single party submitting multiple bids. |
| **Common Registered Address** | `ADDRESS` | +15.0 | Identical premise or high-similarity street address hash. | Shared facility or office premises. |
| **Common Bank Account** | `BANK_ACCOUNT` | +15.0 | Identical bank account number / IFSC. | Financial interdependence or shared beneficiary. |
| **Common PDF Author** | `PDF_AUTHOR` | +10.0 | Identical `Author` string in PDF metadata (e.g. *"Suresh Laptop"*). | Single workstation preparing competing tenders. |
| **Common PDF Timestamp** | `PDF_METADATA` | +10.0 | Concurrent PDF generation timestamp across packages. | Synchronized bid document generation. |
| **Near-Duplicate Declarations** | `DOC_SIMHASH` | +10.0 | Character $k$-shingle Jaccard similarity $\ge 0.85$ on declarations. | Identical template / copy-paste submission. |

---

## 3. Data Model & Contract

### Edge Contract
Every edge in the link graph provides complete evidentiary provenance:
- **`source`**: Source bidder ID or entity ID
- **`target`**: Target bidder ID or entity ID
- **`reason`**: Deterministic explanation of the relationship
- **`evidence`**: Raw parameter values establishing the link
- **`strength`**: Accumulated point weight per Section 10.2

### Direct Bidder Link (`BidderPairLink`)
```python
@dataclass
class BidderPairLink:
    source_bidder: str
    target_bidder: str
    source_bidder_name: str
    target_bidder_name: str
    reason: str
    evidence: dict[str, Any]
    strength: float
    shared_attributes: list[dict[str, Any]]
    cvc_warning: str = "Potential related-party bidding — verify independently (CVC guideline on related bidders)."
```

---

## 4. REST API Endpoints

### 1. `GET /api/v1/tenders/{tender_id}/graph`
Returns the complete bipartite and projected collusion graph for all bidders attached to the specified tender.
- **Roles**: Officer, Evaluator, Vigilance, Admin.
- **Response Model**: `BidderLinkGraphOut`.

### 2. `POST /api/v1/risk/graph`
Computes the deterministic link graph directly from an arbitrary list of bidder payloads without requiring persistent database state.
- **Roles**: Officer, Evaluator, Vigilance, Admin.
- **Payload**:
  ```json
  {
    "tender_id": "NIT-CPCL-2026-PUMP-217",
    "bidders": [
      {
        "bidder_id": "bidder-c",
        "company_name": "Coromandel Engineering Works",
        "phone": "9840198401",
        "pdf_author": "Suresh Laptop"
      },
      {
        "bidder_id": "bidder-d",
        "company_name": "Delta Petrochemical Equipment",
        "phone": "9840198401",
        "pdf_author": "Suresh Laptop"
      }
    ]
  }
  ```
- **Response**: Full graph with nodes, edges, direct links, and cluster metrics.
