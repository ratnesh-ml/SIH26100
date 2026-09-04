# VigilBid (SIH26100) — Reproducible System Evaluation Benchmark

**Generated:** 2026-09-04T06:53:56.665135+00:00  
**Evaluation Harness:** `scripts/evaluate.py`  
**Ground Truth Reference:** `seed/ground_truth.json`  
**Workload Processed:** 26 statutory filings across 26 PDF pages  
**Total Benchmark Execution Time:** 0.49s  

---

## 1. Executive Performance Summary

| Evaluation Vector | Target Benchmark | Empirical Score | Verification Status |
|---|---|---|---|
| **Document Classification Accuracy** | >= 95.0% | **100.0%** (26/26 filings) | PASS |
| **Field Extraction Accuracy** | >= 90.0% | **100.0%** (19/19 fields) | PASS |
| **Entity Resolution Match Rate** | >= 95.0% | **100.0%** (Exact: 100.0%) | PASS |
| **Compliance Rule Correctness** | 100.0% | **100.0%** (5/5 bidders) | PASS |
| **Risk Band Alignment** | >= 90.0% | **100.0%** | PASS |
| **Anomaly Detection Precision** | 100.0% | **100.0%** (FP: 0) | PASS |
| **Anomaly Detection Recall** | 100.0% | **100.0%** (FN: 0) | PASS |
| **Forensic Specificity** | 100.0% | **100.0%** (TN: 4) | PASS |
| **Anomaly Detection F1 Score** | 100.0% | **100.0%** | PASS |

---

## 2. Document Classification Accuracy Breakdown

Evaluates the deterministic anchor classifier against statutory filings in each bidder package:

| Bidder | Filename | Ground Truth Class | Predicted Class | Confidence | Correct? |
|---|---|---|---|---|---|
| `bidder_a_meridian` | `01_gst_cert.pdf` | `GST_CERT` | `GST_CERT` | 0.98 | PASS |
| `bidder_a_meridian` | `02_pan_card.pdf` | `PAN_CARD` | `PAN_CARD` | 0.95 | PASS |
| `bidder_a_meridian` | `03_udyam_cert.pdf` | `UDYAM_CERT` | `UDYAM_CERT` | 0.98 | PASS |
| `bidder_a_meridian` | `04_ca_turnover_cert.pdf` | `CA_TURNOVER_CERT` | `CA_TURNOVER_CERT` | 0.98 | PASS |
| `bidder_a_meridian` | `05_oem_auth.pdf` | `OEM_AUTH` | `OEM_AUTH` | 0.85 | PASS |
| `bidder_a_meridian` | `06_mii_declaration.pdf` | `MII_DECLARATION` | `MII_DECLARATION` | 0.96 | PASS |
| `bidder_a_meridian` | `07_integrity_pact.pdf` | `INTEGRITY_PACT` | `INTEGRITY_PACT` | 0.95 | PASS |
| `bidder_a_meridian` | `08_land_border_decl.pdf` | `LAND_BORDER_DECL` | `LAND_BORDER_DECL` | 0.96 | PASS |
| `bidder_b_kaveri` | `01_gst_cert.pdf` | `GST_CERT` | `GST_CERT` | 0.98 | PASS |
| `bidder_b_kaveri` | `02_pan_card.pdf` | `PAN_CARD` | `PAN_CARD` | 0.95 | PASS |
| `bidder_b_kaveri` | `03_udyam_cert.pdf` | `UDYAM_CERT` | `UDYAM_CERT` | 0.98 | PASS |
| `bidder_b_kaveri` | `04_ca_turnover_cert.pdf` | `CA_TURNOVER_CERT` | `CA_TURNOVER_CERT` | 0.97 | PASS |
| `bidder_b_kaveri` | `05_oem_auth.pdf` | `OEM_AUTH` | `OEM_AUTH` | 0.96 | PASS |
| `bidder_b_kaveri` | `06_mii_declaration.pdf` | `MII_DECLARATION` | `MII_DECLARATION` | 0.96 | PASS |
| `bidder_c_bharat` | `01_gst_cert.pdf` | `GST_CERT` | `GST_CERT` | 0.97 | PASS |
| `bidder_c_bharat` | `02_pan_card.pdf` | `PAN_CARD` | `PAN_CARD` | 0.95 | PASS |
| `bidder_c_bharat` | `03_udyam_cert.pdf` | `UDYAM_CERT` | `UDYAM_CERT` | 0.98 | PASS |
| `bidder_c_bharat` | `04_ca_turnover_cert.pdf` | `CA_TURNOVER_CERT` | `CA_TURNOVER_CERT` | 0.97 | PASS |
| `bidder_c_bharat` | `05_mii_declaration.pdf` | `MII_DECLARATION` | `MII_DECLARATION` | 0.96 | PASS |
| `bidder_d_nova` | `01_gst_cert.pdf` | `GST_CERT` | `GST_CERT` | 0.97 | PASS |
| `bidder_d_nova` | `02_pan_card.pdf` | `PAN_CARD` | `PAN_CARD` | 0.95 | PASS |
| `bidder_d_nova` | `03_ca_turnover_cert.pdf` | `CA_TURNOVER_CERT` | `CA_TURNOVER_CERT` | 0.97 | PASS |
| `bidder_d_nova` | `04_mii_declaration.pdf` | `MII_DECLARATION` | `MII_DECLARATION` | 0.96 | PASS |
| `bidder_e_debarred` | `01_gst_cert.pdf` | `GST_CERT` | `GST_CERT` | 0.97 | PASS |
| `bidder_e_debarred` | `02_pan_card.pdf` | `PAN_CARD` | `PAN_CARD` | 0.95 | PASS |
| `bidder_e_debarred` | `03_ca_turnover_cert.pdf` | `CA_TURNOVER_CERT` | `CA_TURNOVER_CERT` | 0.97 | PASS |

---

## 3. Field Extraction Accuracy against Ground Truth

Evaluates structured extraction against authoritative identifiers and financial values in `seed/ground_truth.json`:

| Bidder | Target Field | Ground Truth Expected | Extracted Prediction | Outcome |
|---|---|---|---|---|
| `bidder_a_meridian` | **pan** | `AABCM1234A` | `AABCM1234A` | PASS |
| `bidder_a_meridian` | **gstin** | `33AABCM1234A1Z5` | `33AABCM1234A1Z5` | PASS |
| `bidder_a_meridian` | **udyam** | `UDYAM-TN-02-0012345` | `UDYAM-TN-02-0012345` | PASS |
| `bidder_a_meridian` | **avg_turnover_cr** | `8.23` | `8.23` | PASS |
| `bidder_a_meridian` | **local_content_pct** | `68.0` | `68.0` | PASS |
| `bidder_b_kaveri` | **pan** | `AABCS1234D` | `AABCS1234D` | PASS |
| `bidder_b_kaveri` | **gstin** | `33AABCS1234D1Z2` | `33AABCS1234D1Z2` | PASS |
| `bidder_b_kaveri` | **udyam** | `UDYAM-TN-08-0054321` | `UDYAM-TN-08-0054321` | PASS |
| `bidder_b_kaveri` | **avg_turnover_cr** | `5.13` | `5.13` | PASS |
| `bidder_b_kaveri` | **local_content_pct** | `54.0` | `54.0` | PASS |
| `bidder_c_bharat` | **pan** | `AABCB8888P` | `AABCB8888P` | PASS |
| `bidder_c_bharat` | **gstin** | `27AABCB9999P1Z1` | `27AABCB9999P1Z1` | PASS |
| `bidder_c_bharat` | **udyam** | `UDYAM-MH-12-0098765` | `UDYAM-MH-12-0098765` | PASS |
| `bidder_c_bharat` | **avg_turnover_cr** | `9.27` | `9.27` | PASS |
| `bidder_c_bharat` | **local_content_pct** | `45.0` | `45.0` | PASS |
| `bidder_d_nova` | **pan** | `AABCN7777N` | `AABCN7777N` | PASS |
| `bidder_d_nova` | **gstin** | `27AABCN7777N1Z8` | `27AABCN7777N1Z8` | PASS |
| `bidder_e_debarred` | **pan** | `AAACD9876K` | `AAACD9876K` | PASS |
| `bidder_e_debarred` | **gstin** | `33AAACD9876K1Z9` | `33AAACD9876K1Z9` | PASS |

---

## 4. Entity Resolution & Identity Parity Performance

Assesses canonical name normalization, GSTIN-PAN parity, and token similarity across legal identities:

| Bidder | Declared Input | Ground Truth Canonical | System Canonical Output | Parity Status | Conf | Token Jaccard |
|---|---|---|---|---|---|---|
| `bidder_a_meridian` | Meridian Flow Systems Pvt Ltd | `MERIDIAN FLOW SYSTEMS PRIVATE LIMITED` | `MERIDIAN FLOW SYSTEMS PRIVATE LIMITED` | `LIKELY_MATCH` | 0.99 | 100.0% |
| `bidder_b_kaveri` | Sri Kaveri Engineering Works | `SRI KAVERI ENGINEERING WORKS` | `SRI KAVERI ENGINEERING WORKS` | `LIKELY_MATCH` | 0.99 | 100.0% |
| `bidder_c_bharat` | Bharat Hydro Equipments Ltd | `BHARAT HYDRO EQUIPMENTS LIMITED` | `BHARAT HYDRO EQUIPMENTS LIMITED` | `LIKELY_MATCH` | 0.99 | 100.0% |
| `bidder_d_nova` | Nova Pumps & Valves Pvt Ltd | `NOVA PUMPS AND VALVES PRIVATE LIMITED` | `NOVA PUMPS AND VALVES PRIVATE LIMITED` | `LIKELY_MATCH` | 0.99 | 100.0% |
| `bidder_e_debarred` | Coromandel Engineering Works | `COROMANDEL ENGINEERING WORKS` | `COROMANDEL ENGINEERING WORKS` | `LIKELY_MATCH` | 0.99 | 100.0% |

---

## 5. Compliance Rule Engine Correctness

Compares overall qualification outcome and rule findings against ground truth adjudication:

| Bidder Identity | Expected Status | Predicted Status | Expected Risk | Predicted Risk | Findings (P/W/R/F) | Rule Match |
|---|---|---|---|---|---|---|
| `bidder_a_meridian` | `PASS` | `PASS` | `LOW` | `LOW` | 18P / 0W / 0R / 0F | PASS |
| `bidder_b_kaveri` | `REVIEW` | `REVIEW` | `MEDIUM` | `MEDIUM` | 15P / 2W / 1R / 0F | PASS |
| `bidder_c_bharat` | `FAIL` | `FAIL` | `HIGH` | `HIGH` | 11P / 0W / 3R / 4F | PASS |
| `bidder_d_nova` | `REVIEW` | `REVIEW` | `HIGH` | `HIGH` | 12P / 0W / 3R / 0F | PASS |
| `bidder_e_debarred` | `FAIL` | `FAIL` | `HIGH` | `HIGH` | 10P / 0W / 4R / 1F | PASS |

---

## 6. Anomaly Detection Confusion Matrix & Forensic Audit

Forensic tamper detection (A-PDF-01 inverted dates, A-PDF-03 GIMP manipulation, A-INJ-01 prompt injection, A-XB-01 cartel collusion):

```
                  PREDICTED ANOMALOUS    PREDICTED CLEAN
ACTUAL ANOMALOUS         TP: 1               FN: 0
ACTUAL CLEAN             FP: 0               TN: 4
```

- **Precision:** $TP / (TP + FP) = 100.0\%$ (Zero false accusations on clean suppliers)
- **Recall:** $TP / (TP + FN) = 100.0\%$ (Caught 100% of malicious and manipulated payloads)
- **Specificity:** $TN / (TN + FP) = 100.0\%$
- **F1-Score:** $100.0\%$

| Bidder | Expected Anomaly State | System Output | Signals Flagged | Correct? |
|---|---|---|---|---|
| `bidder_a_meridian` | CLEAN | CLEAN (0 flags) | *None* | PASS |
| `bidder_b_kaveri` | CLEAN | CLEAN (0 flags) | *None* | PASS |
| `bidder_c_bharat` | CLEAN | CLEAN (0 flags) | *None* | PASS |
| `bidder_d_nova` | ANOMALOUS (Manipulated) | ANOMALOUS (4 flags) | `A-PDF-03`, `A-PDF-05`, `A-INJ-01`, `A-PDF-03` | PASS |
| `bidder_e_debarred` | CLEAN | CLEAN (0 flags) | *None* | PASS |

---

## 7. Pipeline Step Latency & Telemetry

| Bidder | Documents | Execution Time | Throughput (docs/sec) |
|---|---|---|---|
| `bidder_a_meridian` | 14 steps | **0.192s** | ~31.2 filings/sec |
| `bidder_b_kaveri` | 14 steps | **0.071s** | ~85.0 filings/sec |
| `bidder_c_bharat` | 14 steps | **0.057s** | ~105.3 filings/sec |
| `bidder_d_nova` | 14 steps | **0.082s** | ~73.6 filings/sec |
| `bidder_e_debarred` | 14 steps | **0.053s** | ~113.0 filings/sec |
