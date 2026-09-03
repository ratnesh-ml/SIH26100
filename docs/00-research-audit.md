# 00 — Research Audit & Claim Classification

> **Purpose.** Before any design decision, every major recommendation in the research dump was classified. Anything tagged **ASSUMPTION** or **UNVERIFIED** must never be spoken in front of a judge until someone on the team has personally opened the primary source.

**Legend:** 🟢 RESEARCH-BACKED · 🏛️ OFFICIAL REQUIREMENT · 🔧 ENGINEERING DECISION · 🎯 MVP DECISION · 🔮 FUTURE FEATURE · ⚠️ ASSUMPTION / UNVERIFIED · 🚩 LEGAL / ETHICAL FLAG

## 0.1 Headline verdict

The research is strong on **problem framing, regulatory landscape and competitor mapping**, and dangerously over-ambitious on **AI architecture**. It proposes six deep-learning models, six live government API integrations, a GNN, a Siamese signature net, a blockchain ledger and a Kubernetes deployment for a 36-hour, 3-person build. Roughly **60% of the proposed architecture is cut or downgraded** below. What survives is a smaller, deterministic-first, evidence-backed system that is actually demoable and defensible.

## 0.2 Claim-by-claim classification

| # | Research claim / recommendation | Class | Verdict & action |
|---|---|---|---|
| 1 | CAG Report No. 18 of 2020 (GeM audit): 42.79% PAN unverified, 36.12% CIN missing, 12.33% orders (₹792.41 cr) delayed up to 312 days, 39.64% delivery issues | 🟢 (likely) / ⚠️ exact figures | Real audit report; figures plausible. **Action:** one person downloads the CAG PDF and screenshots the exact table before the finale. Quote only what you have seen. |
| 2 | "67% of MSMEs lost tenders in a single month", "82% of rejected bids had minor gaps" (Ram Kumar, LinkedIn) | ⚠️ | Research itself cites it as "Aug 2026" in one place and "Oct 2026" in another — **Oct 2026 is in the future today (Sept 2026)**. LinkedIn anecdote, not audit. **Do not quote numbers.** Say "practitioners report most rejections stem from minor documentation gaps." |
| 3 | GFR 2017 Rule 144 (GeM mandate), Rule 144(xi) land-border restriction (July 2020), Rule 151 debarment, Rule 153(iii) → PPP-MII Order 2017 | 🏛️ | Correct. Encode as citations in the rule engine. |
| 4 | PPP-MII Class-I ≥50% / Class-II ≥20% local content; statutory/cost auditor certificate above ₹10 cr | 🏛️ | Correct per the 2020 revision of the Order. Encode as rules R-MII-01/02. |
| 5 | MSE Policy 2012: EMD/tender-fee exemption for MSEs, 25% procurement target, purchase preference | 🏛️ | Correct. Drives R-EMD-01. |
| 6 | Two-bid CPCL process, Integrity Pact with IEM, OEM Authorization (GeM Annexure-I) | 🏛️ / 🟢 | Correct in substance; exact CPCL tender numbers (CPCLS25471, GeM bid 7088117/7451270) are ⚠️ until opened. |
| 7 | "Live source-of-truth API cross-verification against GSTN, NSDL PAN, MCA21 V3, Udyam, DigiLocker" as Differentiator #1 | ⚠️ + 🔧 | **None of these are open, authorization-free APIs.** GSTN public search has CAPTCHA; PAN/Udyam/MCA need paid aggregators (Surepass/Attestr) or GSP onboarding; DigiLocker needs Requester onboarding + citizen consent. **Decision:** build a `VerificationProvider` interface with a **mock provider + recorded fixtures** for MVP; real adapters are 🔮. Pitch as "verification-ready architecture", never as "live". |
| 8 | Tender Intel is "deployed live at CPCL" | ⚠️ | Sourced from the vendor's own website. Say "Tender Intel publicly states it is used at CPCL." Never state as fact. |
| 9 | PaddleOCR-VL 1.5 (0.9B VLM), 91.66% OmniDocBench, arXiv 2601.21957 | ⚠️ / 🔮 | Paper ID plausible but unverified; a 0.9B VLM is too slow on a CPU laptop for live demo. **Decision:** PyMuPDF text-layer first → PaddleOCR PP-OCRv4 (CPU) → Tesseract fallback. VLM OCR 🔮. |
| 10 | LayoutLMv3 fine-tuned on 200 synthetic samples in hours 2–8 | 🔮 | Needs GPU, labelled boxes, and OCR anyway; English-centric. Indian statutory certificates are **templated** → anchor/regex extraction gets >95% field accuracy with zero training. LayoutLMv3/Donut → 🔮 for non-templated docs. |
| 11 | "Tamil-language MSME certificates" need multilingual OCR | ⚠️ | Udyam certificates are bilingual Hindi/English government templates; key fields are English/Latin. Drop Tamil OCR from MVP. |
| 12 | GNN (GraphSAGE) Vendor Trust Graph for collusion | 🔮 | No labelled collusion data exists for training in 36h; a GNN would be theatre. **Decision:** deterministic **Cross-Bidder Link Graph** (shared director / phone / email / address / bank / PDF-author metadata / near-duplicate text) via NetworkX. Honest, demoable, explainable. |
| 13 | Phantom-Bidder Detector (Ganguly SSRN 2026) | ⚠️ / 🔮 | Paper unverified; needs cross-tender history. Fold the intent into cross-bidder links. Don't cite the paper unless opened. |
| 14 | SigNet Siamese CNN signature verification | 🔮 🚩 | No registry of genuine reference signatures exists; a "forged signature" verdict is a legal accusation. Cut. MVP: **signature-presence** detection only (image/ink region in signature block). |
| 15 | Blockchain / Hyperledger-anchored audit trail | 🔧 (cut) | Hash-chained append-only log gives tamper-evidence without a ledger. Blockchain is a judge red flag ("why?"). Cut; mention as 🔮 only if asked. |
| 16 | Llama-3.1-8B on-prem via vLLM | 🔧 | Needs GPU. **Decision:** explanations are **template-generated deterministically** (always work). LLM (Ollama small model locally, or a hosted API behind an env flag with PII redaction) only polishes prose and answers free-form Copilot questions. Air-gap story preserved because the design never *depends* on the LLM. |
| 17 | RAG Compliance Copilot (LangChain + FAISS, 1200 chunks) | 🎯 SHOULD | The knowledge base is small (~60–120 chunks). Every rule already carries a **hard-coded clause citation**; that gives 90% of the value deterministically. RAG Q&A is SHOULD-HAVE for hours 24–30, in-memory embeddings, no vector DB. |
| 18 | Microservices (classifier-svc, ocr-svc, kv-svc, donut-svc…), Celery+Redis, MinIO, TimescaleDB, Neo4j, Keycloak, ClamAV, Kubernetes | 🔧 (cut) | Monolith FastAPI + one worker process + Postgres + local disk. Docker Compose only. |
| 19 | Next.js 14 with SSR | 🔧 | No SSR need for an internal SPA. Vite + React + TS is lower friction. (If P3 already knows Next.js well, Next.js in SPA mode is acceptable — decide at Hour 0.) |
| 20 | PS jury metric: OCR/entity accuracy > 98%; < 60 s per bidder | 🏛️ | Reconcile: **field-level extraction accuracy ≥98% on text-layer PDFs of templated certificates**; char-level OCR on scans ~90% with confidence gating → human review. Time: ≤60 s for text-layer packages; scanned packages up to ~3 min with per-page parallelism. State both honestly. |
| 21 | XGBoost risk model, GNN AUC ≥ 0.78 | 🔮 | No labelled data. Risk score is a **transparent weighted rule score**. Say so. ML → 🔮 once CPCL history is available. |
| 22 | Fraud detection precision ≥ 85% (PDF tamper) | ⚠️ | Unmeasurable without ground truth. Report only "detected X/X of our seeded tamper cases; 0 false alarms on our 3 clean bidders". |
| 23 | System may "flag fraudulent certificate" | 🚩 | Wording rule: **never** "fraud/forged/fake". Always "anomaly detected — human verification required". Also: final status is a *recommendation*; disqualification is the officer's act (PS mandate). |
| 24 | PII handling (PAN, masked Aadhaar on Udyam, directors' DINs) | 🚩 🏛️ | DPDP Act 2023 + CVC data hygiene. Mask PAN in UI (`ABCDE****F`), encrypt PAN/GSTIN at rest (Fernet), redact identifiers before any LLM call, never send documents to a cloud LLM. |
| 25 | Debarment: CPPP list + World Bank list | 🟢 | Both are freely downloadable. Use a real CPPP snapshot CSV + a few synthetic near-names. Exact PAN/CIN match → FAIL; fuzzy name → REVIEW. |
| 26 | Splink / dedupe for entity resolution | 🔧 | Overkill for ≤40 bidders. `rapidfuzz` + `jellyfish` + normalisation rules. Splink 🔮 at scale. |
| 27 | Haystack vs LangChain latency numbers | ⚠️ | Irrelevant. Drop. |
| 28 | FastAPI + PostgreSQL + JSONB + pgvector | 🔧 🟢 | Agree. |
| 29 | Time-motion "6–10 person-hours per bidder", "8 h → 12 min" | ⚠️ | Practitioner-derived. Say "officer-reported hours per bidder" and present our own measured pipeline time instead. |
| 30 | Research 36-h sprint: LayoutLMv3 fine-tune by hour 8, GNN by hour 28 | 🔧 (replaced) | Replaced by the timeline in §22 of this blueprint. |

## 0.3 Contradictions found in the dump

1. **Ram Kumar dates** — "Aug 2026" vs "Oct 2026" (future). Treat as unverifiable.
2. **OCR target** — research §13 says MVP ≥88% char-F1; the PS jury metric says >98%. Different units (char vs field). We report field-level.
3. **Air-gap vs hosted LLM** — research mandates on-prem Llama yet lists Groq-based repos as references. We resolve by making the LLM optional.
4. **"Must-have in first 18 h" includes a fine-tuned transformer classifier** while also recommending the PS's <60 s processing — impossible on CPU. Replaced by TF-IDF + rules classifier.
5. **Postgres + pgvector chosen** yet FAISS proposed for RAG. Use one (in-memory numpy for MVP; pgvector if it grows).

## 0.4 What the research revealed that we had *not* considered (added)

- **UDIN** (ICAI Unique Document Identification Number) on CA-certified turnover certificates → cheap, deterministic format check and a strong "anomaly" hook. *(Format details ⚠️ verify on udin.icai.org.)*
- **GSTIN embeds PAN** (chars 3–12) → the single most powerful cross-document identity check, zero AI.
- **PAN 4th character = entity type** (C company, P individual, F firm, H HUF, T trust, A AOP…) → must agree with the constitution on the GST certificate and with "Pvt Ltd/LLP/Proprietorship" in the name.
- **Rule 144(xi)** land-border declaration — a mandatory clause in every CPCL NIT; we add it as a checklist item (REVIEW-only).
- **Indirect prompt-injection through uploaded PDFs** — the brief asked for it; the research ignored it. Added as anomaly signal A-INJ-01 and as a demo moment.
- **Integrity Pact IEM** — MVP checks presence + tender reference + signature block, not identity of the IEM.
