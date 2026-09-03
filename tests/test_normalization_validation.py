"""Comprehensive Unit Tests for Field Normalization, Statutory Validation, and Entity Disambiguation."""

import pytest
from pipeline.entity_resolution.normalizer import (
    EntityNormalizer,
    is_same_company,
    normalize_address,
    normalize_legal_abbreviations,
    normalize_org_name,
    normalize_punctuation,
    normalize_whitespace,
)
from pipeline.entity_resolution.validators import (
    validate_address,
    validate_company_name,
    validate_date,
    validate_financial_value,
    validate_gstin,
    validate_pan,
    validate_udyam,
)


# =========================================================================
# 1. PAN Format Validator Tests (Positive and Negative)
# =========================================================================

def test_validate_pan_positive_cases():
    # Company PAN (4th char 'C')
    res_company = validate_pan("AABCC1234F")
    assert res_company.is_valid is True
    assert res_company.normalized_value == "AABCC1234F"

    # Person PAN (4th char 'P')
    res_person = validate_pan("ABCDE1234P")
    assert res_person.is_valid is True

    # Firm PAN (4th char 'F')
    res_firm = validate_pan("AABCF1234G")
    assert res_firm.is_valid is True

    # Whitespace and lower case
    res_ws = validate_pan("  aabcc1234f  ")
    assert res_ws.is_valid is True
    assert res_ws.normalized_value == "AABCC1234F"


def test_validate_pan_negative_cases():
    # Empty and None
    assert validate_pan("").is_valid is False
    assert validate_pan(None).is_valid is False

    # Bad length (9 or 11 chars)
    assert validate_pan("AABCC1234").is_valid is False
    assert validate_pan("AABCC1234FF").is_valid is False

    # Bad character pattern (digits in place of letters)
    assert validate_pan("12345ABCDE").is_valid is False
    assert validate_pan("AAB1C1234F").is_valid is False


# =========================================================================
# 2. GSTIN Format Validator Tests (Positive and Negative)
# =========================================================================

def test_validate_gstin_positive_cases():
    # Valid Tamil Nadu GSTIN (33)
    res_tn = validate_gstin("33AABCC1234F1Z5")
    assert res_tn.is_valid is True
    assert res_tn.normalized_value == "33AABCC1234F1Z5"

    # Valid Maharashtra GSTIN (27)
    res_mh = validate_gstin("27ABCDE1234P1Z2")
    assert res_mh.is_valid is True

    # Lower case and whitespace stripped
    res_clean = validate_gstin("  33aabcc1234f1z5  ")
    assert res_clean.is_valid is True
    assert res_clean.normalized_value == "33AABCC1234F1Z5"


def test_validate_gstin_negative_cases():
    # Empty and None
    assert validate_gstin("").is_valid is False
    assert validate_gstin(None).is_valid is False

    # Invalid State code (98 is not a valid Indian GST state code)
    res_bad_state = validate_gstin("98AABCC1234F1Z5")
    assert res_bad_state.is_valid is False
    assert "Invalid GST state code" in res_bad_state.error_message

    # Invalid embedded PAN structure
    res_bad_pan = validate_gstin("33123451234F1Z5")
    assert res_bad_pan.is_valid is False

    # Invalid length
    assert validate_gstin("33AABCC1234F1Z").is_valid is False


# =========================================================================
# 3. Udyam MSME Validator Tests (Positive and Negative)
# =========================================================================

def test_validate_udyam_positive_cases():
    res = validate_udyam("UDYAM-TN-01-0012345")
    assert res.is_valid is True
    assert res.normalized_value == "UDYAM-TN-01-0012345"

    res_lower = validate_udyam("udyam-dl-05-0098765")
    assert res_lower.is_valid is True
    assert res_lower.normalized_value == "UDYAM-DL-05-0098765"


def test_validate_udyam_negative_cases():
    assert validate_udyam("").is_valid is False
    assert validate_udyam(None).is_valid is False
    assert validate_udyam("UDYAM-12345").is_valid is False
    assert validate_udyam("MSME-TN-01-0012345").is_valid is False


# =========================================================================
# 4. Date Validator Tests (Positive and Negative)
# =========================================================================

def test_validate_date_positive_cases():
    # DD/MM/YYYY
    res_dmy = validate_date("15/08/2023")
    assert res_dmy.is_valid is True
    assert res_dmy.normalized_value == "2023-08-15"

    # DD-MM-YYYY
    res_dash = validate_date("01-07-2017")
    assert res_dash.is_valid is True
    assert res_dash.normalized_value == "2017-07-01"

    # YYYY-MM-DD
    res_iso = validate_date("2024-03-31")
    assert res_iso.is_valid is True
    assert res_iso.normalized_value == "2024-03-31"

    # Month text
    res_text = validate_date("26 January 2022")
    assert res_text.is_valid is True
    assert res_text.normalized_value == "2022-01-26"


def test_validate_date_negative_cases():
    assert validate_date("").is_valid is False
    assert validate_date(None).is_valid is False

    # Zero date
    assert validate_date("00/00/0000").is_valid is False

    # Calendar impossible date (Feb 31)
    res_feb = validate_date("31/02/2023")
    assert res_feb.is_valid is False

    # Non-date string
    assert validate_date("not-a-date").is_valid is False


# =========================================================================
# 5. Financial Numeric Validator Tests (Positive and Negative)
# =========================================================================

def test_validate_financial_value_positive_cases():
    # Crores expression: Rs. 8.42 Crores -> 84,200,000.0
    res_cr = validate_financial_value("Rs. 8.42 Crores")
    assert res_cr.is_valid is True
    assert res_cr.normalized_value == 84200000.0

    # Lakhs expression: ₹ 45.5 Lakhs -> 4,550,000.0
    res_lakh = validate_financial_value("₹ 45.5 Lakhs")
    assert res_lakh.is_valid is True
    assert res_lakh.normalized_value == 4550000.0

    # Comma formatted string
    res_comma = validate_financial_value("1,25,00,000")
    assert res_comma.is_valid is True
    assert res_comma.normalized_value == 12500000.0

    # Raw int / float
    res_num = validate_financial_value(500000)
    assert res_num.is_valid is True
    assert res_num.normalized_value == 500000.0


def test_validate_financial_value_negative_cases():
    assert validate_financial_value("").is_valid is False
    assert validate_financial_value(None).is_valid is False

    # Below minimum
    res_min = validate_financial_value(-500, min_value=0.0)
    assert res_min.is_valid is False

    # Non-numeric garbage
    assert validate_financial_value("unspecified-budget").is_valid is False


# =========================================================================
# 6. Company Name and Address Validator Tests
# =========================================================================

def test_validate_company_name():
    assert validate_company_name("Apex Industrial Solutions Pvt Ltd").is_valid is True
    assert validate_company_name("L&T").is_valid is True

    # Negative
    assert validate_company_name("").is_valid is False
    assert validate_company_name("A").is_valid is False
    assert validate_company_name("123456").is_valid is False


def test_validate_address():
    valid_addr = "Plot 45, Manali Industrial Estate, Chennai, Tamil Nadu, 600068"
    assert validate_address(valid_addr).is_valid is True

    # Negative: too short or no geographical signals
    assert validate_address("").is_valid is False
    assert validate_address("chennai").is_valid is False


# =========================================================================
# 7. Normalization Tests: Whitespace, Punctuation, Abbreviations
# =========================================================================

def test_atomic_normalizations():
    # Whitespace
    raw_ws = "  Apex \t Industrial \n\n Solutions \xa0 Pvt   Ltd  "
    assert normalize_whitespace(raw_ws) == "Apex Industrial Solutions Pvt Ltd"

    # Punctuation & Ampersand
    raw_punct = 'M/s. Kaveri & Sons "Engineering" – Services (India)'
    assert normalize_punctuation(raw_punct) == "M/s. Kaveri AND Sons Engineering - Services India"

    # Legal Abbreviations
    raw_legal = "M/S. REGD. GOVT. CONTRACTOR SHRI APEX"
    assert normalize_legal_abbreviations(raw_legal) == "REGISTERED GOVERNMENT CONTRACTOR APEX"


def test_company_name_standardization():
    normalizer = EntityNormalizer()

    # Private Limited standardizations
    assert normalizer.normalize_company_name("Apex Solutions Pvt. Ltd.") == "APEX SOLUTIONS PRIVATE LIMITED"
    assert normalizer.normalize_company_name("Apex Solutions Pvt Ltd") == "APEX SOLUTIONS PRIVATE LIMITED"
    assert normalizer.normalize_company_name("M/S Apex Solutions Private Limited") == "APEX SOLUTIONS PRIVATE LIMITED"

    # Limited standardizations
    assert normalizer.normalize_company_name("Tata Steel Ltd.") == "TATA STEEL LIMITED"

    # LLP standardization
    assert normalizer.normalize_company_name("Delta Advisors L.L.P.") == "DELTA ADVISORS LLP"


def test_address_normalization_and_expansion():
    raw_addr = "Plot 12, Indl. Est., G.S.T. Rd., Nr. Opp. Railway Stn., Chennai - 600032, TN"
    norm = normalize_address(raw_addr)

    assert norm.pincode == "600032"
    assert norm.state == "Tamil Nadu"
    assert "ROAD" in norm.clean_address
    assert "INDUSTRIAL ESTATE" in norm.clean_address
    assert "NEAR OPPOSITE" in norm.clean_address


# =========================================================================
# 8. Anti-Collision Tests ("Do not accidentally merge unrelated companies")
# =========================================================================

def test_anti_collision_different_sectors_never_merge():
    """Unrelated companies sharing a prefix but differing in distinctive business domains MUST NOT merge."""
    # Apex Solutions vs Apex Technologies
    is_match, score, reason = is_same_company(
        "Apex Solutions Private Limited",
        "Apex Technologies Private Limited",
    )
    assert is_match is False
    assert score < 0.85
    assert "Conflicting distinctive business tokens" in reason

    # Tata Steel vs Tata Motors
    is_match, score, reason = is_same_company(
        "Tata Steel Limited",
        "Tata Motors Limited",
    )
    assert is_match is False
    assert score < 0.85
    assert "Conflicting distinctive business tokens" in reason

    # Reliance Petrochemicals vs Reliance Infrastructure
    is_match, score, reason = is_same_company(
        "Reliance Petrochemicals Limited",
        "Reliance Infrastructure Limited",
    )
    assert is_match is False
    assert score < 0.85


def test_anti_collision_legal_form_mismatch():
    """Private Limited company vs Public Limited company with same name must not merge blindly."""
    is_match, score, reason = is_same_company(
        "Apex Engineering Private Limited",
        "Apex Engineering Limited",
    )
    assert is_match is False
    assert "Legal form mismatch" in reason


def test_safe_positive_merges():
    """Real variations of the SAME company must cleanly match."""
    # With honorific and abbreviation differences
    match1, score1, _ = is_same_company(
        "M/s. Apex Industrial Solutions Pvt. Ltd.",
        "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED",
    )
    assert match1 is True
    assert score1 >= 0.95

    # With ampersand variations
    match2, score2, _ = is_same_company(
        "Kaveri & Sons Engineering Works",
        "Kaveri and Sons Engineering Works",
    )
    assert match2 is True
    assert score2 == 1.0

    # With trailing punctuation
    match3, score3, _ = is_same_company(
        "Siemens Energy India Ltd.",
        "SIEMENS ENERGY INDIA LIMITED",
    )
    assert match3 is True
    assert score3 >= 0.95
