"""Document Chunking engine with metadata, clause detection, and page preservation."""

import re
from typing import Any, Optional
import uuid

from pipeline.rag.models import KnowledgeChunk, KnowledgeDomain


class DocumentChunker:
    """Chunks procurement documents, regulatory texts, and bidder filings while preserving

    strict page references, structural sections, and statutory clauses.
    """

    def __init__(self, target_chunk_size: int = 150, overlap: int = 25):
        self.target_chunk_size = target_chunk_size  # Words per chunk
        self.overlap = overlap

    def chunk_text(
        self,
        text: str,
        domain: KnowledgeDomain,
        document_name: str,
        page_no: Optional[int] = 1,
        section: Optional[str] = None,
        clause: Optional[str] = None,
        bidder_id: Optional[str] = None,
        tender_id: Optional[str] = None,
        rule_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> list[KnowledgeChunk]:
        """Chunk a block of text into structured KnowledgeChunks."""
        if not text or not text.strip():
            return []

        meta = metadata.copy() if metadata else {}
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

        chunks: list[KnowledgeChunk] = []
        words_buffer: list[str] = []
        current_clause = clause

        # Pattern to detect statutory clauses or numbered rules
        clause_pattern = re.compile(
            r"^(?:Rule|Clause|Section|Article|Regulation)\s*([0-9A-Za-z\.\(\)\-]+)",
            re.IGNORECASE,
        )

        for para in paragraphs:
            # Check for clause header
            match = clause_pattern.search(para)
            if match:
                current_clause = match.group(0)

            words = para.split()
            if len(words) <= self.target_chunk_size:
                # Small paragraph: keep intact if buffer empty or flush buffer
                if words_buffer and (len(words_buffer) + len(words) > self.target_chunk_size):
                    chunk_text = " ".join(words_buffer)
                    chunks.append(
                        self._create_chunk(
                            text=chunk_text,
                            domain=domain,
                            document_name=document_name,
                            page_no=page_no,
                            section=section,
                            clause=current_clause,
                            bidder_id=bidder_id,
                            tender_id=tender_id,
                            rule_id=rule_id,
                            metadata=meta,
                        )
                    )
                    words_buffer = words_buffer[-self.overlap:] if self.overlap > 0 else []

                words_buffer.extend(words)
            else:
                # Large paragraph: sliding window split
                if words_buffer:
                    chunk_text = " ".join(words_buffer)
                    chunks.append(
                        self._create_chunk(
                            text=chunk_text,
                            domain=domain,
                            document_name=document_name,
                            page_no=page_no,
                            section=section,
                            clause=current_clause,
                            bidder_id=bidder_id,
                            tender_id=tender_id,
                            rule_id=rule_id,
                            metadata=meta,
                        )
                    )
                    words_buffer = []

                step = max(1, self.target_chunk_size - self.overlap)
                for i in range(0, len(words), step):
                    window = words[i : i + self.target_chunk_size]
                    if window:
                        chunks.append(
                            self._create_chunk(
                                text=" ".join(window),
                                domain=domain,
                                document_name=document_name,
                                page_no=page_no,
                                section=section,
                                clause=current_clause,
                                bidder_id=bidder_id,
                                tender_id=tender_id,
                                rule_id=rule_id,
                                metadata=meta,
                            )
                        )

        # Flush remaining words in buffer
        if words_buffer:
            chunk_text = " ".join(words_buffer)
            chunks.append(
                self._create_chunk(
                    text=chunk_text,
                    domain=domain,
                    document_name=document_name,
                    page_no=page_no,
                    section=section,
                    clause=current_clause,
                    bidder_id=bidder_id,
                    tender_id=tender_id,
                    rule_id=rule_id,
                    metadata=meta,
                )
            )

        return chunks

    def chunk_pages(
        self,
        pages: list[dict[str, Any]],
        domain: KnowledgeDomain,
        document_name: str,
        bidder_id: Optional[str] = None,
        tender_id: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> list[KnowledgeChunk]:
        """Chunk a multi-page document representation where each entry has page_no and text."""
        all_chunks: list[KnowledgeChunk] = []
        for page_info in pages:
            p_no = page_info.get("page_no") or page_info.get("page") or 1
            p_text = page_info.get("text", "")
            p_section = page_info.get("section")
            p_clause = page_info.get("clause")

            page_chunks = self.chunk_text(
                text=p_text,
                domain=domain,
                document_name=document_name,
                page_no=int(p_no),
                section=p_section,
                clause=p_clause,
                bidder_id=bidder_id,
                tender_id=tender_id,
                metadata=metadata,
            )
            all_chunks.extend(page_chunks)
        return all_chunks

    def _create_chunk(
        self,
        text: str,
        domain: KnowledgeDomain,
        document_name: str,
        page_no: Optional[int],
        section: Optional[str],
        clause: Optional[str],
        bidder_id: Optional[str],
        tender_id: Optional[str],
        rule_id: Optional[str],
        metadata: dict[str, Any],
    ) -> KnowledgeChunk:
        chunk_id = f"{domain.value if isinstance(domain, KnowledgeDomain) else domain}_{uuid.uuid4().hex[:10]}"
        return KnowledgeChunk(
            chunk_id=chunk_id,
            domain=domain,
            text=text.strip(),
            document_name=document_name,
            page_no=page_no or 1,
            clause=clause,
            section=section,
            bidder_id=bidder_id,
            tender_id=tender_id,
            rule_id=rule_id,
            metadata=metadata,
        )
