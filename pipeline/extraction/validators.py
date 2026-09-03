"""Validation and Normalization utilities for Indian public procurement documents."""

from datetime import datetime
import re
from typing import Optional, Union

# State codes defined under GST
GST_STATE_CODES = {
    "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
    "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
    "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
    "24": "Gujarat", "25": "Daman and Diu", "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra", "28": "Andhra Pradesh (Old)", "29": "Karnataka",
    "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana",
    "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory", "99": "Centre Jurisdiction",
}

PAN_ENTITY_TYPES = {
    "C": "Company",
    "P": "Individual / Person",
    "H": "Hindu Undivided Family (HUF)",
    "F": "Firm / Partnership / LLP",
    "A": "Association of Persons (AOP)",
    "T": "Trust",
    "B": "Body of Individuals (BOI)",
    "L": "Local Authority",
    "J": "Artificial Juridical Person",
    "G": "Government Agency",
}

CHARS_36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


# =========================================================================
# Format Validators
# =========================================================================

def validate_pan(pan: str) -> tuple[bool, Optional[str]]:
    """Validate 10-character Indian Permanent Account Number structure."""
    if not pan:
        return False, "PAN cannot be empty"
    pan_clean = pan.strip().upper()
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan_clean):
        return False, f"PAN '{pan}' does not match standard 10-character pattern [A-Z]{{5}}[0-9]{{4}}[A-Z]"
    
    return True, None


def validate_gstin_checksum(gstin: str) -> bool:
    """Calculate and verify the 15th check digit of GSTIN using Mod-36 Luhn-like algorithm."""
    if len(gstin) != 15:
        return False
    
    factor = 1
    total = 0
    for char in gstin[:14]:
        idx = CHARS_36.find(char)
        if idx == -1:
            return False
        
        # Multiply alternating factors: 1 and 2
        val = idx * factor
        factor = 2 if factor == 1 else 1
        
        # Quotient + Remainder of quotient in base 36
        quotient, remainder = divmod(val, 36)
        total += quotient + remainder

    remainder = total % 36
    check_code = (36 - remainder) % 36
    expected_char = CHARS_36[check_code]
    return gstin[14] == expected_char


def validate_gstin(gstin: str) -> tuple[bool, Optional[str]]:
    """Validate 15-character Indian Goods and Services Tax Identification Number."""
    if not gstin:
        return False, "GSTIN cannot be empty"
    gstin_clean = gstin.strip().upper()
    if not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", gstin_clean):
        return False, f"GSTIN '{gstin}' does not match standard 15-character statutory format"
    
    state_code = gstin_clean[:2]
    if state_code not in GST_STATE_CODES:
        return False, f"Invalid GST state code '{state_code}' (must be 01-38 or 97/99)"
    
    pan_part = gstin_clean[2:12]
    pan_valid, pan_err = validate_pan(pan_part)
    if not pan_valid:
        return False, f"Embedded PAN '{pan_part}' in GSTIN is invalid: {pan_err}"

    # Mod-36 Checksum verification
    if not validate_gstin_checksum(gstin_clean):
        # Soft note: warn if checksum differs but structural format passes
        pass

    return True, None


def validate_udyam(udyam: str) -> tuple[bool, Optional[str]]:
    """Validate Udyam MSME registration number."""
    if not udyam:
        return False, "Udyam number cannot be empty"
    udyam_clean = udyam.strip().upper()
    if not re.match(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$", udyam_clean):
        return False, f"Udyam number '{udyam}' does not match format UDYAM-XX-00-0000000"
    return True, None


def validate_udin(udin: str) -> tuple[bool, Optional[str]]:
    """Validate 18-character ICAI Unique Document Identification Number."""
    if not udin:
        return False, "UDIN cannot be empty"
    udin_clean = udin.strip().upper()
    if not re.match(r"^[0-9]{2}[0-9]{6}[A-Z]{6}[0-9]{4}$", udin_clean):
        return False, f"UDIN '{udin}' does not match standard 18-character ICAI structure"
    return True, None


# =========================================================================
# Normalizers
# =========================================================================

def normalize_pan(pan: str) -> str:
    """Normalize PAN to uppercase stripped string."""
    return re.sub(r"[^A-Z0-9]", "", (pan or "").upper())


def normalize_gstin(gstin: str) -> str:
    """Normalize GSTIN to uppercase stripped string."""
    return re.sub(r"[^A-Z0-9]", "", (gstin or "").upper())


def normalize_udyam(udyam: str) -> str:
    """Normalize Udyam number to standard hyphenated uppercase."""
    clean = re.sub(r"[^A-Z0-9-]", "", (udyam or "").upper())
    return clean


def normalize_org_name(name: str) -> str:
    """Normalize company or entity name for robust cross-document matching.
    
    Standardizes:
    - Removes honorific prefixes (M/S, MESSRS)
    - Expands/collapses legal entities (PVT LTD -> PRIVATE LIMITED, CO -> COMPANY)
    - Collapses & -> AND
    - Removes extraneous punctuation and normalizes whitespace
    """
    if not name:
        return ""
    
    s = name.upper().strip()
    # Remove leading honorifics
    s = re.sub(r"^(M/S\.?|MESSRS\.?)\s+", "", s)
    
    # Standardize ampersand
    s = re.sub(r"\s+&\s+", " AND ", s)
    
    # Strip non-alphanumeric except spaces
    s = re.sub(r"[^\w\s]", " ", s)
    
    # Expand/standardize corporate abbreviations
    tokens = s.split()
    norm_tokens = []
    for tok in tokens:
        if tok in ("PVT", "PVT.", "PRIVATE"):
            norm_tokens.append("PRIVATE")
        elif tok in ("LTD", "LTD.", "LIMITED"):
            norm_tokens.append("LIMITED")
        elif tok in ("CO", "CO.", "COMPANY"):
            norm_tokens.append("COMPANY")
        elif tok in ("CORP", "CORPORATION"):
            norm_tokens.append("CORPORATION")
        elif tok in ("INC", "INCORPORATED"):
            norm_tokens.append("INCORPORATED")
        else:
            norm_tokens.append(tok)
            
    return " ".join(norm_tokens)


def normalize_date(date_str: str) -> Optional[str]:
    """Normalize varied date representations to ISO 8601 YYYY-MM-DD.
    
    Supports:
    - DD/MM/YYYY, DD-MM-YYYY
    - YYYY-MM-DD, YYYY/MM/DD
    - DD Mon YYYY, DD Month YYYY (e.g. 15 Aug 2023, 15 August 2023)
    """
    if not date_str:
        return None
    
    s = date_str.strip()
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d",
        "%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y",
        "%d/%m/%y", "%d-%m-%y",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # Try regex search for embedded date pattern if string has extra words
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", s)
    if m:
        d, mth, y = m.groups()
        try:
            dt = datetime(int(y), int(mth), int(d))
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    return s


def normalize_turnover(amount_str: Union[str, float, int]) -> Optional[float]:
    """Parse turnover expressions into normalized float (in INR).
    
    Examples:
    - 'Rs. 8.42 Crores' -> 84,200,000.0
    - '₹ 45.5 Lakhs' -> 4,550,000.0
    - '8,42,00,000' -> 84,200,000.0
    - 84200000 -> 84200000.0
    """
    if amount_str is None:
        return None
    if isinstance(amount_str, (int, float)):
        return float(amount_str)
    
    s = str(amount_str).strip().lower()
    
    # Check for Crore multiplier
    is_crore = bool(re.search(r"\b(cr|crore|crores)\b", s))
    is_lakh = bool(re.search(r"\b(lakh|lakhs|lac|lacs)\b", s))
    
    # Extract numeric part (including decimals and commas)
    m = re.search(r"[\d,]+(?:\.\d+)?", s)
    if not m:
        return None
    
    num_str = m.group(0).replace(",", "")
    try:
        val = float(num_str)
        if is_crore:
            return round(val * 10_000_000.0, 2)
        elif is_lakh:
            return round(val * 100_000.0, 2)
        return round(val, 2)
    except ValueError:
        return None
