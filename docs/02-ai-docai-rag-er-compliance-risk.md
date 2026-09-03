# Part 1 (cont.) — Sections 05–10: AI Architecture, Document AI, RAG, Entity Resolution, Compliance Engine, Risk/Fraud Engine

---

## 05 — AI Architecture: AI vs Rules per task

| Task | AI | Rules | Hybrid | Decision & reason |
|---|---|---|---|---|
| Document type classification | ✔ | ✔ | **Hybrid** | Filename hints + keyword rules give ~85%; TF-IDF + logistic regression on first-page text (trained on our synthetic corpus, seconds on CPU) lifts to ~97%; keyword rules win ties; confidence <0.6 → UNKNOWN → officer re-tags in UI. |
| Text acquisition | ✔ (OCR) | ✔ | Hybrid | Text layer if ≥50 chars/page else OCR. OCR is the only "heavy" ML in the critical path. |
| Field extraction (templated certs: GST, PAN, Udyam, ITR-V) | | ✔ | **Rules** | Anchor labels ("Legal Name", "GSTIN") + regex + positional heuristics. Deterministic, explainable, >98% on text-layer. |
| Field extraction (semi-structured: OEM letter, IP, declarations) | ✔ | ✔ | Hybrid | Regex for identifiers/dates; keyword windows for "authorised", "valid till"; optional LLM JSON extraction behind flag, validated by regex post-check. |
| Turnover from financial statements | ✔ | ✔ | Hybrid | Prefer **CA turnover certificate** (templated table). Full audited P&L parsing = pdfplumber table extraction + "Revenue from operations" row regex; else REVIEW. |
| Identifier validation | | ✔ | **Rules** | GSTIN checksum (mod-36), PAN pattern + 4th char, Udyam pattern, CIN 21-char structure, IFSC, UDIN length. |
| Name / address matching | ✔ | ✔ | **Hybrid** | Normalisation rules + token-set ratio (rapidfuzz) + Jaro-Winkler + phonetic (metaphone) → weighted score; thresholds calibrated on synthetic variants. |
| Registry verification | | ✔ | Rules | Provider interface; mock returns status/name/date; compare deterministically. |
| Compliance decision | | ✔ | **Rules + human** | Never AI. Every status maps to a rule ID and clause. |
| Anomaly detection | | ✔ | Rules (+ML future) | Metadata/xref/producer/font signals, duplicate text hashing, injection regex. No classifier. |
| Risk score | | ✔ | Rules | Weighted sum; weights in `risk_weights.yaml`. |
| Explanation text | ✔ (optional) | ✔ | Hybrid | Template first; LLM may rewrite for fluency only, never introduce facts (post-check: all numbers/IDs in output must exist in input). |
| Copilot Q&A | ✔ | ✔ | Hybrid | Retrieval (embeddings or TF-IDF) is mandatory; generation optional. |
| Cross-bidder links | | ✔ | Rules | Exact/fuzzy shared identifiers; graph via NetworkX. |

**Models actually in the MVP:** (1) PaddleOCR PP-OCRv4 (en) or Tesseract 5 — OCR; (2) scikit-learn TF-IDF + LogisticRegression — classifier; (3) `bge-small-en-v1.5` via sentence-transformers (or TF-IDF fallback) — retrieval; (4) *optional* small LLM (Ollama `qwen2.5:3b`/`llama3.2:3b` locally, or hosted behind `LLM_PROVIDER` env) — prose & Q&A. That's it. Pitch it as a strength: **"AI where inputs are messy, code where the law is clear."**

---

## 06 — Document AI pipeline (deep dive)

### 06.1 Decision pipeline
```
PDF ──▶ sniff magic bytes (%PDF-) ──▶ PyMuPDF open (repair if needed)
  ├─ per page: text = page.get_text("words")  (word + bbox)
  │     if len(text) ≥ 50 chars & not garbage → TEXT_LAYER path (conf = 1.0)
  │     else → render 300 dpi PNG → OCR → words+bbox+conf (OCR path)
  ├─ hybrid pages: if text layer exists but page also has large image covering >80% area → run OCR too, flag A-TXT-01 if OCR text ≠ text layer (possible overlaid invisible text)
  ├─ page_text[] + words[] persisted (JSONB)  ─▶ classifier ─▶ doc_type, conf
  └─ extractor[doc_type](words, page_text) ─▶ fields{name: {value, raw, page, bbox, conf, method}}
        ─▶ normaliser ─▶ validators
```

### 06.2 OCR option analysis
| Option | Accuracy (printed EN) | Speed (CPU, 300dpi A4) | Complexity | Hardware | 36-h feasibility | Demo reliability | Verdict |
|---|---|---|---|---|---|---|---|
| **Tesseract 5 (LSTM, eng)** | Good on clean scans; weak on stamps/skew | ~1–2 s/page | Very low (`pytesseract`) | CPU | ✔ | High | **Fallback** (apt install) |
| **PaddleOCR PP-OCRv4 (det+rec, en)** | Better on noisy/rotated text, stamps | ~2–4 s/page CPU | Low–medium (pip, model download ~20 MB) | CPU ok | ✔ | High once models cached | **Primary OCR** |
| EasyOCR | Similar to Paddle, slower | 4–8 s/page CPU | Low | CPU/GPU | ✔ | Medium | Skip |
| PaddleOCR-VL 1.5 (0.9B VLM) | Best on complex layouts | 20–60 s/page CPU | Medium | GPU wanted | ✘ | Low | Future |
| Google Document AI / Azure DI | Excellent | fast | Low code, but cloud + key | Cloud | ✘ (air-gap, keys) | n/a | Excluded |
| LayoutLMv3 (token classification) | 90–96% F1 on benchmarks after fine-tune | needs OCR + GPU fine-tune | High (labelling) | GPU | ✘ | Low | Future |
| Donut (OCR-free) | Good, needs fine-tune per template | slow CPU | High | GPU | ✘ | Low | Future |
| OCR + LLM JSON extraction | Flexible | LLM latency | Low | GPU/API | Optional | Medium | Flag-gated helper for semi-structured docs only |
| Vision LLM | Flexible | slow/expensive | Low | GPU/API | ✘ | Low | Excluded |

**Chosen:** PyMuPDF text layer → PaddleOCR (primary) → Tesseract (fallback if Paddle import/model fails). Pre-process: deskew (OpenCV minAreaRect), grayscale, adaptive threshold, upscale <150 dpi pages.

### 06.3 Document types (MVP taxonomy — 13 classes)
`GST_CERT, PAN_CARD, UDYAM_CERT, CA_TURNOVER_CERT, AUDITED_FINANCIALS, ITR_ACK, OEM_AUTH, INTEGRITY_PACT, MII_DECLARATION, LAND_BORDER_DECL, EMD_PROOF, WORK_ORDER/COMPLETION_CERT, BANK_DETAILS, TECH_COMPLIANCE, UNKNOWN`

Classifier features: filename tokens; first 1,500 chars; presence of anchor phrases (`Form GST REG-06`, `Permanent Account Number`, `Udyam Registration Number`, `UDIN`, `Integrity Pact`, `Annexure-I`, `local content`, `land border`, `ITR-V`).

### 06.4 Field extraction spec (highest-value fields)
| Doc | Fields | Method | Validation |
|---|---|---|---|
| GST_CERT (REG-06) | gstin, legal_name, trade_name, constitution, principal_address, registration_date, status(if printed), state_code | anchor→next-line/right-of-label; regex `\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]` | mod-36 checksum; state code 01–38; PAN⊂GSTIN |
| PAN_CARD | pan, name, father_name(ignore/PII), dob_or_incorp | regex `[A-Z]{5}\d{4}[A-Z]`; name = line above/below "Name" | 4th char entity type; 5th char = surname/entity-name initial (soft) |
| UDYAM_CERT | udyam_no, enterprise_name, enterprise_type(Micro/Small/Medium), major_activity, organisation_type, date_of_incorporation, registration_date, nic_codes[], official_address, pan(if printed), gstin(if printed), classification_year | anchors; regex `UDYAM-[A-Z]{2}-\d{2}-\d{7}` | pattern; category in {Micro,Small,Medium}; address ~ GST address |
| CA_TURNOVER_CERT | firm_name, fy[], turnover[], udin, ca_name, membership_no, frn, date | table extraction (pdfplumber) or regex `FY ?20\d\d-\d\d.*?₹?[\d,]+` | UDIN 18 alphanumerics; sum/avg vs threshold |
| ITR_ACK (ITR-V) | pan, ay, name, gross_total_income/total_income, filing_date, ack_no | anchors | pan match; AY sequence covers required years |
| OEM_AUTH | oem_name, authorised_firm, tender_ref, validity_date, signatory, signature_present | keyword windows; date regex; signature block image detection | firm name ≈ bidder; tender_ref ≈ NIT no.; validity ≥ bid due date |
| INTEGRITY_PACT | tender_ref, bidder_name, bidder_signature_present, witness_present, pages_count | anchors + image detection | tender_ref match; signature present |
| MII_DECLARATION | declared_class (I/II), local_content_pct, auditor_cert_present, udin | regex `\d{1,3}(\.\d+)?\s*%` near "local content" | pct ≥ 50/20; auditor cert if value > ₹10 cr |
| LAND_BORDER_DECL | declaration_present, registration_required(bool), registration_no | keyword windows | presence only → PASS/REVIEW |
| EMD_PROOF | instrument_type, amount, bank, validity | regex on ₹ and date | amount ≥ EMD, or MSE exemption via valid Udyam |
| WORK_ORDER | client, value, date, description | regex/keywords | sum vs experience threshold (REVIEW if uncertain) |

Every field record: `{value, raw, page, bbox:[x0,y0,x1,y1], conf, method: "text|ocr|table|llm"}`.

### 06.5 Confidence policy
`field.conf = page_conf × pattern_conf`. Text-layer page_conf=1.0; OCR page_conf = mean word conf of the matched span. pattern_conf: 1.0 for regex-validated identifiers, 0.9 anchor-adjacent, 0.7 heuristic, 0.6 LLM-extracted. Rule engine treats conf <0.85 as *uncertain* → REVIEW.

---

## 07 — RAG / Knowledge System

### 07.1 Is RAG required?
**Verdict: Useful but optional for MVP; mandatory-feeling for judges if it is *grounded*.** The core explainability requirement is satisfied **without** RAG because every rule carries a fixed citation (rule → clause → KB anchor). RAG adds value only for (a) free-form officer questions ("Is an MSE exempt from EMD in a works tender?") and (b) surfacing the clause text alongside a finding. Build as SHOULD-HAVE in hours 24–30, retrieval-first.

### 07.2 Knowledge base (index this)
- GFR 2017: Rules 144 (incl. 144(xi)), 149–153, 170 (bid security/EMD), 175 (Integrity Pact) — *(verify rule numbers against the GFR PDF before indexing)*
- Public Procurement (Preference to Make in India) Order 2017 + 2020 revision (Class-I/II, ₹10 cr auditor threshold)
- Public Procurement Policy for MSEs Order 2012 + 2018 amendment (EMD/tender-fee exemption, 25%, purchase preference)
- CVC circulars on Integrity Pact & IEMs (selected), CVC circular on document verification
- CPCL/GeM tender boilerplate: eligibility clauses, OEM Annexure-I format, GeM GTC relevant clauses
- Our own **rule descriptions** (each rule = a chunk with ID) so the copilot can explain the system's own logic

**Do NOT index:** bidder documents (PII + injection vector), research papers, LinkedIn posts, competitor pages, anything not an authority.

### 07.3 Design
```
kb/*.md (≈60–120 chunks, 300–500 tokens, front-matter: source, clause, url, effective_date)
   ▶ embeddings (bge-small-en-v1.5, CPU, ~1 s for whole KB) → numpy matrix in memory (pickle cache)
   ▶ retriever: cosine top-8, metadata filter by source
   ▶ reranker: lexical overlap (BM25 via rank_bm25) blended 0.5/0.5  (no cross-encoder)
   ▶ generator: OPTIONAL LLM with system prompt "answer only from passages; cite [S1]…; if absent say so"
   ▶ fallback (no LLM): return passages with headings + the matching rule descriptions
Output contract: {answer, citations:[{source, clause, url, quote}], used_llm: bool}
```
Every answer shows **SOURCE → EVIDENCE (quote) → REASONING → RESULT**. If `used_llm=false` UI says "Retrieved clauses (no generative model)".

---

## 08 — Entity Resolution (core module)

### 08.1 Normalisation (`normalize_org_name`)
1. Uppercase, strip diacritics/punctuation, collapse whitespace.
2. Expand/collapse legal suffixes via dictionary: `PVT|PVT.|PRIVATE → PRIVATE`, `LTD|LTD.|LIMITED → LIMITED`, `LLP`, `OPC`, `& → AND`, `CO. → COMPANY`, `M/S`, `MESSRS` removed.
3. Produce `core_name` = name minus legal-form tokens; `legal_form` = detected form.
4. Address: uppercase, expand `RD/ROAD, ST/STREET, NR/NEAR, OPP/OPPOSITE, FLR/FLOOR`, extract 6-digit PIN, state name via GST state-code table.

### 08.2 Scoring algorithm
```
name_sim   = 0.5·token_set_ratio(core_a, core_b)/100 + 0.3·jaro_winkler(core_a, core_b) + 0.2·[metaphone(core_a)==metaphone(core_b)]
addr_sim   = 0.6·[pin_a==pin_b] + 0.4·token_set_ratio(addr_a, addr_b)/100
pan_link   = 1 if PAN(doc) == GSTIN[2:12] else 0          (hard identifier)
udyam_link = 1 if Udyam.pan==PAN or Udyam.gstin==GSTIN else 0.5 if names match else 0
legal_form_consistent = PAN 4th char ↔ legal_form ↔ GST constitution agree

EntityConfidence = 0.45·pan_link + 0.30·name_sim + 0.15·addr_sim + 0.10·udyam_link
                   − 0.20·[¬legal_form_consistent]
```
Bands: **≥0.85 SAME_ENTITY**, **0.60–0.85 PROBABLE (REVIEW)**, **<0.60 MISMATCH (FAIL candidate, still human-confirmed)**. Weights are an **engineering decision** justified by identifier primacy (PAN⊂GSTIN is authoritative), tuned on our synthetic variant set (report the tuning numbers honestly).

### 08.3 Cross-bidder resolution
Same scorer pairwise across bidders in a tender on: name, PAN, GSTIN, phone, email, address, bank account, director names, PDF `Author`/`Producer`, text simhash of declarations. Edges with weight and evidence → §10.

---

## 09 — Compliance Engine

### 09.1 Rule definition format (`rules/cpcl_goods_v1.yaml`)
```yaml
- id: R-GST-01
  title: GSTIN structurally valid
  category: HARD
  applies_when: tender.requires_gst
  inputs: [GST_CERT.gstin]
  evaluator: gstin_checksum
  on_true: PASS
  on_false: FAIL
  on_missing: REVIEW
  citation: {source: "CGST Rules 2017, Rule 10 / GSTIN structure", kb: "gst-structure"}
  explain: "GSTIN {gstin} {'passes' if ok else 'fails'} the check-digit test."
```
Categories: **HARD** (FAIL possible), **SOFT** (max WARN), **HUMAN** (max REVIEW), **SIGNAL** (anomaly, feeds risk only).

### 09.2 MVP rule library (34 rules)
| ID | Rule | Cat | Result mapping | Citation |
|---|---|---|---|---|
| R-DOC-01..12 | Required document present (one per mandatory doc type in tender) | HARD | missing → **REVIEW** (not FAIL — could be misclassified) unless officer marks "confirmed missing" | Tender clause |
| R-GST-01 | GSTIN checksum | HARD | FAIL/PASS | GSTIN structure |
| R-GST-02 | GSTIN[2:12] == PAN | HARD | mismatch → FAIL | PAN-GSTIN linkage |
| R-GST-03 | GST legal name ≈ bidder name (ER ≥0.85) | SOFT/HUMAN | <0.85 → REVIEW | Tender eligibility |
| R-GST-04 | Registry status Active (provider) | HARD | Cancelled → FAIL; unavailable → WARN | GSTN |
| R-GST-05 | GST state ≠ declared principal state | SOFT | WARN | — |
| R-PAN-01 | PAN pattern + 4th char ↔ legal form | HARD | FAIL | PAN structure |
| R-PAN-02 | PAN name ≈ GST legal name | HUMAN | REVIEW | — |
| R-PAN-03 | Registry status valid (provider) | HARD | FAIL/WARN | NSDL |
| R-UDY-01 | Udyam number pattern | HARD | FAIL | Udyam |
| R-UDY-02 | Udyam category ∈ {Micro,Small} when MSE benefits claimed | HARD | FAIL if Medium claims MSE EMD exemption | MSE Order 2012 |
| R-UDY-03 | Udyam PAN/GSTIN == bidder PAN/GSTIN | HARD | FAIL | — |
| R-UDY-04 | Udyam NIC code relevant to tender category | HUMAN | REVIEW | MSE Order (manufacturing/services) |
| R-EMD-01 | EMD present ≥ amount OR valid MSE exemption | HARD | FAIL/PASS | GFR 170 / MSE Order |
| R-FIN-01 | Avg turnover (last 3 FY) ≥ threshold | HARD | FAIL if conf≥0.9; else REVIEW | Tender BEC |
| R-FIN-02 | UDIN present & 18-char | SOFT | WARN | ICAI UDIN |
| R-FIN-03 | ITR-V present for 3 AYs with matching PAN | HARD/HUMAN | missing → REVIEW; PAN mismatch → FAIL | Tender BEC |
| R-FIN-04 | Turnover in CA cert vs ITR total income plausibility | SIGNAL | anomaly if wildly inconsistent | — |
| R-OEM-01 | OEM letter names bidder (ER≥0.85) & tender ref | HARD/HUMAN | REVIEW | GeM Annexure-I |
| R-OEM-02 | OEM validity ≥ bid due date | HARD | FAIL | — |
| R-OEM-03 | Signature present on OEM letter | SOFT | WARN | — |
| R-IP-01 | Integrity Pact present, references tender, signed | HARD/HUMAN | missing → REVIEW; unsigned → WARN | CVC IP guidelines |
| R-MII-01 | Local content % ≥ class threshold (50/20) | HARD | FAIL | PPP-MII Order 2017 |
| R-MII-02 | Auditor certificate if tender value > ₹10 cr | HARD | REVIEW | PPP-MII 2020 rev. |
| R-MII-03 | Declared class vs claimed purchase preference consistent | SOFT | WARN | — |
| R-LB-01 | Rule 144(xi) declaration present | HARD | missing → REVIEW | GFR 144(xi) |
| R-LB-02 | Declares land-border origin without registration no. | HARD | FAIL-candidate → REVIEW (legal) | GFR 144(xi) |
| R-DEB-01 | PAN/CIN/GSTIN exact match in debarment snapshot | HARD | FAIL | GFR 151 / CPPP |
| R-DEB-02 | Name fuzzy match in debarment (≥0.9) | HUMAN | REVIEW | — |
| R-EXP-01 | Similar-work value ≥ threshold | HUMAN | REVIEW (always human) | Tender BEC |
| R-ENT-01 | Entity confidence across docs ≥0.85 | HARD/HUMAN | <0.6 FAIL-candidate → REVIEW; 0.6–0.85 REVIEW | — |
| R-DATE-01 | Any certificate expired / dated after bid due date | HARD | FAIL/WARN | — |

Hard-coded principle: **the engine can output FAIL, but the UI label for a bidder with FAILs is "Recommended: Not Qualified — officer confirmation required."**

### 09.3 Status precedence
Per criterion: FAIL > REVIEW > WARN > PASS. Per bidder: any FAIL → Not-Qualified-Recommended; else any REVIEW → Needs Review; else WARN → Qualified with observations; else Qualified.

---

## 10 — Risk / Fraud Engine

### 10.1 Vocabulary rule (legal)
The system **never** outputs "fraud", "forged", "fake", "tampered". It outputs **anomaly signals** with severity and a required human action. Report text uses: *"Potential anomaly detected — human verification required."*

### 10.2 Inputs & weights (`risk_weights.yaml`, all visible in UI)
| Driver | Source | Points |
|---|---|---|
| Each HARD FAIL | rules | +25 (cap 50) |
| Each REVIEW | rules | +8 (cap 24) |
| Each WARN | rules | +3 (cap 12) |
| Entity confidence 0.6–0.85 / <0.6 | ER | +10 / +20 |
| A-PDF-01 ModDate < CreationDate or >1 yr gap after "issued" date on a govt certificate | forensics | +6 |
| A-PDF-02 Incremental updates ≥2 on a certificate (xref count) | forensics | +8 |
| A-PDF-03 Producer is an image editor / generic "Microsoft Word" for a GST/Udyam cert | forensics | +6 |
| A-PDF-04 Text-layer ≠ OCR text on same page (hidden overlay) | forensics | +12 |
| A-PDF-05 Font subset mismatch within a single certificate page (mixed fonts on values only) | forensics | +5 |
| A-XB-01 Same PDF Author/Producer/CreationDate across different bidders | cross-bidder | +10 |
| A-XB-02 Shared phone/email/address/bank/director | cross-bidder | +15 |
| A-XB-03 Near-duplicate text (simhash ≤3 bits) of declarations across bidders | cross-bidder | +10 |
| A-INJ-01 Prompt-injection-like text ("ignore previous instructions", white text, tiny font) | injection scan | +10 |
| A-DEB-01 Fuzzy debarment near-match | debarment | +10 |
Score = min(100, Σ). Bands: 0–24 Low · 25–54 Medium · 55–100 High. **Justification:** hard legal failures dominate; anomalies alone (max ~60) can push to High but never to FAIL without a rule — anomalies require human confirmation.

### 10.3 What is realistically detectable in 36 h
| Detectable (build) | Not detectable (say so honestly) |
|---|---|
| PDF metadata inconsistencies; incremental-update count; producer/creator strings; embedded font list; text-vs-OCR mismatch; JavaScript/embedded files in PDF; page-size inconsistency across a multi-page cert | Whether a certificate was *actually* issued by GSTN/Udyam (needs registry) |
| Cross-bidder shared identifiers & metadata; near-duplicate documents | Signature authenticity |
| Injection strings, invisible text (render colour ≈ background, font size <2 pt) | Image-level splice forensics (ELA is unreliable on rescanned docs) |
| Debarment list matches | Beneficial-ownership collusion (needs MCA data) |

### 10.4 Cross-Bidder Link Graph (replaces GNN)
Nodes: bidders + shared attribute nodes (phone, email, address-hash, bank-acct, director, pdf-author, doc-simhash). Edges weighted per §10.2. NetworkX → JSON → frontend force graph (react-force-graph or d3). Demo moment: Bidder C and Bidder D share `Author: "Suresh Laptop"` and the same phone → red edge → "Potential related-party bidding — verify independently (CVC guideline on related bidders)."
