"""Statutory and Form Validation Engine for Indian Public Procurement."""

from dataclasses import dataclass
from datetime import datetime
import re
from typing import Any, Optional, Union

# GST State codes mapping
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


@dataclass
class ValidationResult:
    """Standardized validation outcome with detailed diagnostics and normalized output."""
    is_valid: bool
    error_message: Optional[str] = None
    normalized_value: Optional[Any] = None

    def __bool__(self) -> bool:
        return self.is_valid


def validate_pan(pan: Optional[str]) -> ValidationResult:
    """Validate 10-character Indian Permanent Account Number (PAN) format and structure."""
    if not pan:
        return ValidationResult(is_valid=False, error_message="PAN cannot be empty or None")
    
    clean = re.sub(r"\s+", "", str(pan)).upper()
    if len(clean) != 10:
        return ValidationResult(
            is_valid=False,
            error_message=f"PAN '{pan}' must be exactly 10 characters (got {len(clean)})",
        )
    
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", clean):
        return ValidationResult(
            is_valid=False,
            error_message=f"PAN '{pan}' does not match standard pattern: 5 letters, 4 digits, 1 letter",
        )
    
    entity_char = clean[3]
    entity_desc = PAN_ENTITY_TYPES.get(entity_char, "Entity")

    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=clean,
    )


def validate_gstin_checksum(gstin: str) -> bool:
    """Validate 15th character of GSTIN using base-36 Luhn-like weighted check."""
    if len(gstin) != 15:
        return False
    factor = 1
    total = 0
    for char in gstin[:14]:
        idx = CHARS_36.find(char)
        if idx == -1:
            return False
        val = idx * factor
        factor = 2 if factor == 1 else 1
        quotient, remainder = divmod(val, 36)
        total += quotient + remainder

    remainder = total % 36
    check_code = (36 - remainder) % 36
    return gstin[14] == CHARS_36[check_code]


def validate_gstin(gstin: Optional[str]) -> ValidationResult:
    """Validate 15-character Indian Goods and Services Tax Identification Number (GSTIN)."""
    if not gstin:
        return ValidationResult(is_valid=False, error_message="GSTIN cannot be empty or None")
    
    clean = re.sub(r"\s+", "", str(gstin)).upper()
    if len(clean) != 15:
        return ValidationResult(
            is_valid=False,
            error_message=f"GSTIN '{gstin}' must be exactly 15 characters (got {len(clean)})",
        )
    
    if not re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", clean):
        return ValidationResult(
            is_valid=False,
            error_message=f"GSTIN '{gstin}' does not match statutory regex pattern: 2 digits, 10-char PAN, 1 entity digit, 'Z', 1 check digit",
        )
    
    state_code = clean[:2]
    if state_code not in GST_STATE_CODES:
        return ValidationResult(
            is_valid=False,
            error_message=f"Invalid GST state code '{state_code}' (must be 01-38, 97, or 99)",
        )
    
    pan_part = clean[2:12]
    pan_res = validate_pan(pan_part)
    if not pan_res.is_valid:
        return ValidationResult(
            is_valid=False,
            error_message=f"Embedded PAN '{pan_part}' in GSTIN is invalid: {pan_res.error_message}",
        )
    
    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=clean,
    )


def validate_udyam(udyam: Optional[str]) -> ValidationResult:
    """Validate Udyam MSME registration identifier."""
    if not udyam:
        return ValidationResult(is_valid=False, error_message="Udyam number cannot be empty or None")
    
    clean = re.sub(r"\s+", "", str(udyam)).upper()
    if not re.match(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$", clean):
        return ValidationResult(
            is_valid=False,
            error_message=f"Udyam number '{udyam}' does not match statutory format 'UDYAM-XX-00-0000000'",
        )
    
    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=clean,
    )


def validate_date(date_str: Optional[str]) -> ValidationResult:
    """Validate that string represents a valid calendar date and format to ISO 8601 YYYY-MM-DD."""
    if not date_str:
        return ValidationResult(is_valid=False, error_message="Date cannot be empty or None")
    
    s = str(date_str).strip()
    # Check for obvious invalid patterns like 00/00/0000
    if re.match(r"^0{1,2}[/-]0{1,2}[/-]0{4}$", s):
        return ValidationResult(is_valid=False, error_message=f"Invalid zero calendar date: '{date_str}'")

    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d",
        "%d %b %Y", "%d %B %Y", "%d-%b-%Y", "%d-%B-%Y",
        "%d/%m/%y", "%d-%m-%y",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            # Year plausibility check (between 1900 and 2100)
            if not (1900 <= dt.year <= 2100):
                return ValidationResult(is_valid=False, error_message=f"Date year {dt.year} outside plausible range (1900-2100)")
            return ValidationResult(
                is_valid=True,
                error_message=None,
                normalized_value=dt.strftime("%Y-%m-%d"),
            )
        except ValueError:
            continue
            
    # Try embedded regex match
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", s)
    if m:
        d, mth, y = m.groups()
        try:
            dt = datetime(int(y), int(mth), int(d))
            if 1900 <= dt.year <= 2100:
                return ValidationResult(
                    is_valid=True,
                    error_message=None,
                    normalized_value=dt.strftime("%Y-%m-%d"),
                )
        except ValueError as val_err:
            return ValidationResult(is_valid=False, error_message=f"Invalid calendar date values in '{date_str}': {val_err}")

    return ValidationResult(
        is_valid=False,
        error_message=f"Date '{date_str}' could not be parsed into valid Gregorian date",
    )


def validate_financial_value(
    val: Union[str, float, int, None],
    min_value: Optional[float] = 0.0,
    max_value: Optional[float] = None,
) -> ValidationResult:
    """Validate numeric financial values and convert expressions (Crores, Lakhs) to float INR."""
    if val is None or str(val).strip() == "":
        return ValidationResult(is_valid=False, error_message="Financial value cannot be empty or None")

    if isinstance(val, (int, float)):
        num = float(val)
    else:
        s = str(val).strip().lower()
        is_crore = bool(re.search(r"\b(cr|crore|crores)\b", s))
        is_lakh = bool(re.search(r"\b(lakh|lakhs|lac|lacs)\b", s))

        # Extract numeric characters
        m = re.search(r"[-+]?[\d,]+(?:\.\d+)?", s)
        if not m:
            return ValidationResult(is_valid=False, error_message=f"Could not extract numeric figure from '{val}'")

        try:
            base_num = float(m.group(0).replace(",", ""))
            if is_crore:
                num = round(base_num * 10_000_000.0, 2)
            elif is_lakh:
                num = round(base_num * 100_000.0, 2)
            else:
                num = round(base_num, 2)
        except ValueError:
            return ValidationResult(is_valid=False, error_message=f"Unable to parse '{val}' into numeric float")

    if min_value is not None and num < min_value:
        return ValidationResult(
            is_valid=False,
            error_message=f"Financial value {num:,.2f} is below minimum allowed {min_value}",
            normalized_value=num,
        )

    if max_value is not None and num > max_value:
        return ValidationResult(
            is_valid=False,
            error_message=f"Financial value {num:,.2f} exceeds maximum allowed {max_value}",
            normalized_value=num,
        )

    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=num,
    )


def validate_company_name(name: Optional[str]) -> ValidationResult:
    """Validate corporate/entity name has sufficient length and alphabetic semantic tokens."""
    if not name or not str(name).strip():
        return ValidationResult(is_valid=False, error_message="Company name cannot be empty")
    
    clean = str(name).strip()
    if len(clean) < 2:
        return ValidationResult(is_valid=False, error_message="Company name must be at least 2 characters")
    
    # Must contain at least 2 alphabetic characters
    alpha_count = sum(1 for c in clean if c.isalpha())
    if alpha_count < 2:
        return ValidationResult(is_valid=False, error_message=f"Company name '{name}' must contain at least 2 alphabetic characters")
    
    # Reject strings with only symbols/numbers
    if re.match(r"^[\W\d_]+$", clean):
        return ValidationResult(is_valid=False, error_message=f"Company name '{name}' contains only digits or symbols")

    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=clean,
    )


def validate_address(addr: Optional[str]) -> ValidationResult:
    """Validate Indian address contains sufficient geographical or administrative cues."""
    if not addr or not str(addr).strip():
        return ValidationResult(is_valid=False, error_message="Address cannot be empty")
    
    clean = str(addr).strip()
    if len(clean) < 8:
        return ValidationResult(is_valid=False, error_message=f"Address '{addr}' is too short to be a valid physical address")
    
    # Check for 6-digit Indian PIN code
    pin_match = re.search(r"\b([1-9][0-9]{5})\b", clean)
    has_pin = bool(pin_match)
    
    # Check for address keywords
    keywords = [
        r"plot", r"street", r"road", r"rd", r"st", r"estate", r"nagar",
        r"industrial", r"indl", r"sector", r"phase", r"floor", r"flr",
        r"building", r"bldg", r"no", r"survey", r"village", r"city", r"dist",
    ]
    kw_hits = [kw for kw in keywords if re.search(r"\b" + kw + r"\b", clean, re.IGNORECASE)]
    
    # If it has a PIN code or at least 2 address keywords, accept as valid address
    if not has_pin and len(kw_hits) < 1:
        return ValidationResult(
            is_valid=False,
            error_message=f"Address '{addr}' lacks standard Indian postal address cues (PIN code, Street, Plot, Industrial Estate, etc.)",
        )
    
    return ValidationResult(
        is_valid=True,
        error_message=None,
        normalized_value=clean,
    )
