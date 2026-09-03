"""Curated Regulatory and Statutory Knowledge Base for Public Procurement (SIH26100).

Contains authoritative clauses from:
- GFR 2017 (General Financial Rules)
- MSE Order 2012 (Public Procurement Policy for Micro & Small Enterprises)
- PPP-MII Order 2017 (Make in India Local Content Preference)
- CVC Guidelines & Circulars (Integrity, Collusion, Single Bidder)
- ICAI UDIN Guidelines (Chartered Accountant Certificate Validation)
- CPCL Standard BEC (Bid Evaluation Criteria for CPCL Goods & Services)
"""

from pipeline.rag.models import KnowledgeChunk, KnowledgeDomain


def get_default_regulatory_chunks() -> list[KnowledgeChunk]:
    """Return the curated authoritative regulatory corpus."""
    raw_clauses = [
        # =========================================================================
        # GFR 2017
        # =========================================================================
        {
            "id": "REG_GFR_144",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 144",
            "section": "Fundamental Principles of Public Buying",
            "page_no": 42,
            "text": (
                "Rule 144 of GFR 2017 establishes the fundamental principles of public buying. "
                "Every authority delegated with the financial powers of procuring goods in public interest shall "
                "have the responsibility and accountability to bring efficiency, economy, and transparency in "
                "matters relating to public procurement and for fair and equitable treatment of suppliers and "
                "promotion of competition in public procurement. Specifications must not be tailor-made to favor "
                "a particular bidder and must allow wide participation."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "Principles of Procurement"},
        },
        {
            "id": "REG_GFR_149",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 149",
            "section": "Government e-Marketplace (GeM)",
            "page_no": 44,
            "text": (
                "Rule 149 of GFR 2017 governs procurement through the Government e-Marketplace (GeM). "
                "Procurement of common use Goods and Services by Ministries or Departments will be mandatory for "
                "Goods or Services available on GeM. Procuring entities must utilize GeM bidding tools and verify "
                "vendor credentials through integrated online registries."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "GeM Procurement"},
        },
        {
            "id": "REG_GFR_153",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 153",
            "section": "Reserved Items and MSE Procurement Policy",
            "page_no": 46,
            "text": (
                "Rule 153 of GFR 2017 mandates that the Central Government may issue instructions for "
                "reservation of specific items for exclusive procurement from Micro and Small Enterprises (MSEs). "
                "A total of 358 items are reserved for exclusive procurement from MSEs. Procuring entities must "
                "enforce public procurement preference policy guidelines issued by the Ministry of MSME."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "MSE Reservation"},
        },
        {
            "id": "REG_GFR_161",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 161",
            "section": "Two-Bid System (Technical and Financial)",
            "page_no": 49,
            "text": (
                "Rule 161 of GFR 2017 outlines the Two-Bid System. For purchasing high-value capital equipment, "
                "machinery, or complex goods, bids shall be invited simultaneously in two parts: Part-I (Technical Bid) "
                "and Part-II (Financial Bid). Technical bids are opened first and evaluated strictly against the "
                "pre-qualification criteria (PQC) and Bid Evaluation Criteria (BEC). Financial bids of only those bidders "
                "who are found technically qualified shall be opened at a subsequent notified date."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "Two-Bid System"},
        },
        {
            "id": "REG_GFR_170_1",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 170(i)",
            "section": "Bid Security (Earnest Money Deposit - EMD) Exemption",
            "page_no": 52,
            "text": (
                "Rule 170(i) of GFR 2017 specifies Bid Security (EMD) requirements. To safeguard against a bidder's "
                "withdrawing or altering its bid during the bid validity period, Bid Security (also known as Earnest Money) "
                "is to be obtained from the bidders except Micro and Small Enterprises (MSEs) as defined in MSE Procurement "
                "Policy issued by Department of Micro, Small and Medium Enterprises (MSME) or are registered with the "
                "Central Purchase Organisation or the concerned Ministry or Department, or Startups as recognized by "
                "Department for Promotion of Industry and Internal Trade (DPIIT). MSE bidders are 100% exempt from EMD."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "EMD Exemption for MSEs"},
        },
        {
            "id": "REG_GFR_170_2",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 170(ii)",
            "section": "Bid Security Declaration",
            "page_no": 53,
            "text": (
                "Rule 170(ii) of GFR 2017 permits procuring entities to accept a Bid Security Declaration in lieu of "
                "Bid Security / EMD. In place of a physical Bank Guarantee or Demand Draft for EMD, bidders submit a signed "
                "declaration accepting that if they withdraw or modify their bids during the period of validity, or fail to "
                "sign the contract on award, they will be suspended from bidding in tenders of the procuring organization "
                "for a specified period."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "Bid Security Declaration"},
        },
        {
            "id": "REG_GFR_173_V",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 173(v)",
            "section": "Seeking Clarifications on Technical Bids",
            "page_no": 56,
            "text": (
                "Rule 173(v) of GFR 2017 governs clarifications during bid evaluation. During the examination, evaluation, "
                "and comparison of bids, the procuring entity may, at its discretion, ask any bidder for clarification of its "
                "bid, including document authentications and minor non-conformities. The request for clarification and the "
                "response shall be in writing. No change in the substance or prices of the bid shall be sought, offered, "
                "or permitted. Post-tender negotiations with bidders other than L1 are strictly prohibited."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "Clarifications Without Price Change"},
        },
        {
            "id": "REG_GFR_175",
            "document_name": "General Financial Rules (GFR) 2017",
            "clause": "Rule 175",
            "section": "Code of Integrity in Public Procurement",
            "page_no": 58,
            "text": (
                "Rule 175 of GFR 2017 details the Code of Integrity. Procuring authorities as well as bidders and contractors "
                "shall observe the highest standard of ethics. Bidders must not indulge in anti-competitive practices, "
                "collusion, bid rigging, price fixing, or cartel formation. Furthermore, bidders must disclose any conflict "
                "of interest (such as cross-directorships or common ownership) that would compromise fair competition. "
                "Violations lead to disqualification, forfeiture of EMD, and debarment."
            ),
            "metadata": {"statute": "GFR 2017", "legal_weight": "MANDATORY", "topic": "Code of Integrity and Anti-Collusion"},
        },

        # =========================================================================
        # MSE Order 2012
        # =========================================================================
        {
            "id": "REG_MSE_04",
            "document_name": "Public Procurement Policy for MSEs Order 2012",
            "clause": "Clause 4",
            "section": "Tender Document Fee and EMD Exemption for MSEs",
            "page_no": 3,
            "text": (
                "Clause 4 of Public Procurement Policy for Micro and Small Enterprises (MSEs) Order, 2012 provides that "
                "MSEs registered with District Industries Centres, Khadi and Village Industries Commission, or having valid "
                "Udyam Registration Certificate issued by Ministry of MSME shall be issued tender documents free of cost and "
                "are exempt from payment of earnest money deposit (EMD). The exemption applies to goods produced and services "
                "rendered by MSE enterprises matching their registered NIC code."
            ),
            "metadata": {"statute": "MSE Order 2012", "legal_weight": "MANDATORY", "topic": "MSE EMD & Fee Waiver"},
        },
        {
            "id": "REG_MSE_08",
            "document_name": "Public Procurement Policy for MSEs Order 2012",
            "clause": "Clause 8",
            "section": "Purchase Preference for MSEs in Tender Awards",
            "page_no": 5,
            "text": (
                "Clause 8 of Public Procurement Policy for MSEs Order 2012 establishes the purchase preference mechanism. "
                "In tenders where the L1 price is quoted by a non-MSE bidder, all participating MSE bidders quoting a price "
                "within the price band of L1 + 15% shall be allowed to supply a portion of the requirement up to 25% by "
                "matching their price to the L1 price. Within this 25%, sub-targets of 4% for SC/ST MSEs and 3% for Women MSEs "
                "are earmarked."
            ),
            "metadata": {"statute": "MSE Order 2012", "legal_weight": "MANDATORY", "topic": "MSE Purchase Preference (L1+15%)"},
        },
        {
            "id": "REG_MSE_13",
            "document_name": "Ministry of MSME Gazette Notification S.O. 2119(E)",
            "clause": "Notification S.O. 2119(E)",
            "section": "Udyam Registration as Sole Valid Proof of MSE Status",
            "page_no": 2,
            "text": (
                "Ministry of MSME Gazette Notification S.O. 2119(E) dated 26.06.2020 mandates Udyam Registration as the "
                "sole valid document for establishing Micro, Small, or Medium Enterprise status with effect from 01.07.2020. "
                "All prior registrations (Udyog Aadhaar Memorandum / EM-II) became invalid after 30.06.2022. Procurement officers "
                "must verify the 19-digit Udyam number format (UDYAM-XX-00-0000000) and verify that the activity matches "
                "the tender scope."
            ),
            "metadata": {"statute": "MSMED Act 2006", "legal_weight": "MANDATORY", "topic": "Udyam Registration Mandate"},
        },

        # =========================================================================
        # PPP-MII Order 2017 (Make in India)
        # =========================================================================
        {
            "id": "REG_MII_03A",
            "document_name": "Public Procurement (Preference to Make in India) Order 2017",
            "clause": "Clause 3A",
            "section": "Class-I Local Supplier Definition & Eligibility",
            "page_no": 4,
            "text": (
                "Clause 3A of PPP-MII Order 2017 defines 'Class-I Local Supplier' as a supplier or service provider whose "
                "goods, services, or works offered for procurement has local content equal to or more than 50%. Only Class-I "
                "local suppliers are eligible for purchase preference in public tenders where the estimated value is up to ₹200 Crores, "
                "and global tender enquiry (GTE) is prohibited without cabinet secretariat approval."
            ),
            "metadata": {"statute": "PPP-MII 2017", "legal_weight": "MANDATORY", "topic": "Class-I Local Supplier (>=50%)"},
        },
        {
            "id": "REG_MII_03B",
            "document_name": "Public Procurement (Preference to Make in India) Order 2017",
            "clause": "Clause 3B",
            "section": "Class-II Local Supplier Definition",
            "page_no": 4,
            "text": (
                "Clause 3B of PPP-MII Order 2017 defines 'Class-II Local Supplier' as a supplier or service provider whose "
                "goods, services, or works offered for procurement has local content equal to or more than 20% but less than 50%. "
                "Class-II local suppliers are eligible to bid in domestic tenders but do NOT receive purchase preference over "
                "Class-I local suppliers."
            ),
            "metadata": {"statute": "PPP-MII 2017", "legal_weight": "MANDATORY", "topic": "Class-II Local Supplier (20%-50%)"},
        },
        {
            "id": "REG_MII_09",
            "document_name": "Public Procurement (Preference to Make in India) Order 2017",
            "clause": "Clause 9",
            "section": "Verification of Local Content Percentage and CA Certification",
            "page_no": 7,
            "text": (
                "Clause 9 of PPP-MII Order 2017 specifies the verification procedure for local content. "
                "For tenders of estimated value up to ₹10 Crores, the bidder shall submit a self-certification indicating the "
                "percentage of local content and details of the location(s) at which local value addition is made. "
                "For tenders exceeding ₹10 Crores, the bidder must submit a certificate from the statutory auditor or cost auditor "
                "of the company (or practicing Chartered Accountant for entities other than companies) with valid UDIN."
            ),
            "metadata": {"statute": "PPP-MII 2017", "legal_weight": "MANDATORY", "topic": "Local Content CA Verification"},
        },

        # =========================================================================
        # CVC Guidelines & Circulars
        # =========================================================================
        {
            "id": "REG_CVC_COLLUSION",
            "document_name": "CVC Office Order No. 04/02/2019",
            "clause": "Circular 04/02/2019",
            "section": "Detection of Cartelization and Related Party Bidding",
            "page_no": 2,
            "text": (
                "CVC Circular 04/02/2019 on Cartelization in Public Procurement mandates that procuring entities must closely "
                "examine technical and commercial bids for indicators of collusion. Red flags include: common registered or "
                "operational addresses, common authorized signatories or directors, identical bank branches / accounts, "
                "matching phone numbers or email domains, identical creation timestamps in electronic bid files, or matching "
                "PDF producer / author metadata. Bidders linked through related parties submitting competitive quotes in the "
                "same tender violate competition rules and face immediate disqualification."
            ),
            "metadata": {"statute": "CVC Guidelines", "legal_weight": "MANDATORY", "topic": "Collusion and Cartel Red Flags"},
        },
        {
            "id": "REG_CVC_INTEGRITY",
            "document_name": "CVC Office Order No. 01/01/2021",
            "clause": "Circular 01/01/2021",
            "section": "Adoption of Integrity Pact in Public Tenders",
            "page_no": 3,
            "text": (
                "CVC Circular 01/01/2021 provides guidelines on the adoption of the Integrity Pact (IP) in Government "
                "Departments and Public Sector Enterprises (CPSEs). For tenders above the threshold limit (typically ₹1 Crore), "
                "the bidder must sign an Integrity Pact binding both the buyer and seller to avoid all forms of corruption, "
                "bribery, extortion, or fraudulent influence. Any dispute or complaint regarding the evaluation process may be "
                "referred to Independent External Monitors (IEMs)."
            ),
            "metadata": {"statute": "CVC Guidelines", "legal_weight": "MANDATORY", "topic": "Integrity Pact and IEMs"},
        },
        {
            "id": "REG_CVC_SINGLE_BID",
            "document_name": "CVC Vigilance Manual (Procurement Chapter)",
            "clause": "Manual Clause 5.12",
            "section": "Evaluation and Acceptance of Single Response in Open Tenders",
            "page_no": 78,
            "text": (
                "Clause 5.12 of CVC Vigilance Manual clarifies that receipt of a single bid in response to an open, advertised "
                "tender does not automatically necessitate retendering if: (a) wide publicity was ensured through CPPP and national "
                "dailies; (b) qualification criteria were non-restrictive; (c) the bid is fully compliant with specifications; "
                "and (d) the quoted price is reasonable and benchmarked against estimated cost. However, acceptance of a single "
                "qualified bid requires detailed recording of justification and approval of the competent authority."
            ),
            "metadata": {"statute": "CVC Guidelines", "legal_weight": "ADVISORY", "topic": "Single Bidder Acceptance"},
        },

        # =========================================================================
        # ICAI UDIN Guidelines
        # =========================================================================
        {
            "id": "REG_ICAI_UDIN",
            "document_name": "ICAI Gazette Notification / Guidance Note on UDIN",
            "clause": "UDIN Mandate 2019",
            "section": "Unique Document Identification Number for Chartered Accountant Certificates",
            "page_no": 1,
            "text": (
                "The Institute of Chartered Accountants of India (ICAI) has made generation of Unique Document Identification "
                "Number (UDIN) mandatory for all certificates, net worth statements, and turnover declarations issued by "
                "practicing Chartered Accountants. A valid UDIN consists of an 18-digit alphanumeric string where characters 1-6 "
                "represent the ICAI membership number, characters 7-12 represent the date of generation (DDMMYY), and characters "
                "13-18 are a unique sequential document identifier. Per Ministry of Finance and CVC directives, financial certificates "
                "submitted in public tenders without a valid, verifiable UDIN must be treated as unauthenticated."
            ),
            "metadata": {"statute": "ICAI Guidelines", "legal_weight": "MANDATORY", "topic": "ICAI UDIN Validation"},
        },

        # =========================================================================
        # CPCL Bid Evaluation Criteria (BEC) Standard
        # =========================================================================
        {
            "id": "REG_CPCL_BEC_TURNOVER",
            "document_name": "CPCL Standard Bid Evaluation Criteria (Goods)",
            "clause": "BEC Clause 2.1",
            "section": "Annual Financial Turnover Criteria (30% Rule)",
            "page_no": 12,
            "text": (
                "Under CPCL BEC Clause 2.1, the average annual turnover of the bidder during the preceding three financial "
                "years (FY 2022-23, 2023-24, 2024-25) must be at least 30% of the estimated tender value. The turnover must be "
                "supported by audited Balance Sheets and Profit & Loss Accounts certified by a Chartered Accountant bearing "
                "a valid ICAI UDIN. Bidders whose turnover falls below 30% fail the mandatory commercial criteria."
            ),
            "metadata": {"statute": "CPCL BEC", "legal_weight": "MANDATORY", "topic": "Annual Turnover 30% Requirement"},
        },
        {
            "id": "REG_CPCL_BEC_EXPERIENCE",
            "document_name": "CPCL Standard Bid Evaluation Criteria (Goods)",
            "clause": "BEC Clause 2.2",
            "section": "Technical Experience & Prior Work Execution Criteria",
            "page_no": 14,
            "text": (
                "Under CPCL BEC Clause 2.2, the bidder must have successfully executed similar supply orders in petroleum refineries, "
                "fertilizers, petrochemicals, or power sectors in the preceding 7 years ending on the last day of the month prior to "
                "the bid due date. Bidders must meet one of the following: (a) Three similar completed supply orders each costing "
                "not less than 40% of estimated value; (b) Two similar completed supply orders each costing not less than 50% of estimated value; "
                "or (c) One similar completed supply order costing not less than 80% of estimated value."
            ),
            "metadata": {"statute": "CPCL BEC", "legal_weight": "MANDATORY", "topic": "Prior Experience 40-50-80% Rule"},
        },
        {
            "id": "REG_CPCL_BEC_PAN_GST",
            "document_name": "CPCL Standard General Purchase Conditions",
            "clause": "GPC Clause 1.4",
            "section": "Mandatory Tax Identifiers & PAN-GSTIN Parity",
            "page_no": 5,
            "text": (
                "Under CPCL GPC Clause 1.4, the bidder must possess a valid PAN issued by the Income Tax Department and a valid "
                "GSTIN registration under the CGST/SGST/IGST Act. The 10-character PAN embedded in characters 3 through 12 of the "
                "GSTIN must strictly match the declared PAN card. Any structural disparity or name inconsistency between PAN "
                "and GST records requires officer verification and suspension of technical qualification until clarified."
            ),
            "metadata": {"statute": "CPCL BEC", "legal_weight": "MANDATORY", "topic": "PAN-GSTIN Parity"},
        },
    ]

    chunks = []
    for item in raw_clauses:
        chunk = KnowledgeChunk(
            chunk_id=item["id"],
            domain=KnowledgeDomain.REGULATORY,
            text=item["text"],
            document_name=item["document_name"],
            page_no=item["page_no"],
            clause=item["clause"],
            section=item["section"],
            metadata=item["metadata"],
        )
        chunks.append(chunk)

    return chunks
