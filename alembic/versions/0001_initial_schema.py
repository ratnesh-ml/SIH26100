"""Initial schema for VigilBid (17 tables)

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-03 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role IN ('officer', 'evaluator', 'approver', 'vigilance', 'auditor', 'admin')", name='check_user_role'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. tenders
    op.create_table(
        'tenders',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('nit_no', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('portal', sa.String(length=50), nullable=False, server_default='GeM'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'),
        sa.Column('estimated_value', sa.Numeric(precision=16, scale=2), nullable=True),
        sa.Column('bid_due_date', sa.Date(), nullable=True),
        sa.Column('mse_applicable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('mii_class_required', sa.String(length=50), nullable=True, server_default='Class-I'),
        sa.Column('requires_oem', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('DRAFT', 'ACTIVE', 'EVALUATING', 'CLOSED', 'ARCHIVED')", name='check_tender_status'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tenders_nit_no', 'tenders', ['nit_no'], unique=True)

    # 3. criteria
    op.create_table(
        'criteria',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tender_id', sa.Uuid(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('threshold', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('required_doc_types', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('rule_ids', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tender_id', 'code', name='uq_tender_criterion_code'),
    )

    # 4. bidders
    op.create_table(
        'bidders',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tender_id', sa.Uuid(), nullable=False),
        sa.Column('declared_name', sa.String(length=500), nullable=False),
        sa.Column('canonical_name', sa.String(length=500), nullable=True),
        sa.Column('pan_enc', sa.LargeBinary(), nullable=True),
        sa.Column('gstin_enc', sa.LargeBinary(), nullable=True),
        sa.Column('udyam_no', sa.String(length=50), nullable=True),
        sa.Column('cin', sa.String(length=50), nullable=True),
        sa.Column('address', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('contact', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('entity_confidence', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('overall_status', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('risk_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('risk_band', sa.String(length=50), nullable=False, server_default='LOW'),
        sa.Column('review_state', sa.String(length=50), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("overall_status IN ('PENDING', 'PASS', 'WARN', 'REVIEW', 'FAIL')", name='check_bidder_status'),
        sa.CheckConstraint("risk_band IN ('LOW', 'MEDIUM', 'HIGH')", name='check_bidder_risk_band'),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bidders_tender_id', 'bidders', ['tender_id'])
    op.create_index('ix_bidders_canonical_name', 'bidders', ['canonical_name'])

    # 5. documents
    op.create_table(
        'documents',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=False),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('storage_path', sa.String(length=1000), nullable=False),
        sa.Column('mime', sa.String(length=100), nullable=False, server_default='application/pdf'),
        sa.Column('page_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('doc_type', sa.String(length=100), nullable=False, server_default='UNKNOWN'),
        sa.Column('doc_type_conf', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('doc_type_source', sa.String(length=50), nullable=True),
        sa.Column('text_source', sa.String(length=50), nullable=True),
        sa.Column('metadata', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('forensic', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bidder_id', 'sha256', name='uq_bidder_document_sha'),
    )
    op.create_index('ix_documents_bidder_id', 'documents', ['bidder_id'])
    op.create_index('ix_documents_doc_type', 'documents', ['doc_type'])

    # 6. document_pages
    op.create_table(
        'document_pages',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('document_id', sa.Uuid(), nullable=False),
        sa.Column('page_no', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('words', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('ocr_conf', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('png_path', sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'page_no', name='uq_document_page'),
    )
    op.create_index('ix_document_pages_doc_id', 'document_pages', ['document_id'])

    # 7. extracted_fields
    op.create_table(
        'extracted_fields',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('document_id', sa.Uuid(), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('value_norm', sa.Text(), nullable=True),
        sa.Column('raw', sa.Text(), nullable=True),
        sa.Column('page_no', sa.Integer(), nullable=True),
        sa.Column('bbox', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('method', sa.String(length=50), nullable=True),
        sa.Column('value_hash', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'field_name', name='uq_doc_field'),
    )
    op.create_index('ix_extracted_fields_doc_id', 'extracted_fields', ['document_id'])
    op.create_index('ix_extracted_fields_field_name', 'extracted_fields', ['field_name'])

    # 8. verification_events
    op.create_table(
        'verification_events',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('document_id', sa.Uuid(), nullable=True),
        sa.Column('verifier', sa.String(length=100), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='mock'),
        sa.Column('request', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('response', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('checked_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_verification_events_bidder_id', 'verification_events', ['bidder_id'])

    # 9. findings
    op.create_table(
        'findings',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('criterion_id', sa.Uuid(), nullable=True),
        sa.Column('rule_id', sa.String(length=100), nullable=False),
        sa.Column('rule_version', sa.String(length=20), nullable=False, server_default='1.0'),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('citation', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('evidence', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=4, scale=3), nullable=True),
        sa.Column('extracted', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('expected', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('PASS', 'WARN', 'REVIEW', 'FAIL', 'INFO')", name='check_finding_status'),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['criterion_id'], ['criteria.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_findings_bidder_id', 'findings', ['bidder_id'])
    op.create_index('ix_findings_rule_id', 'findings', ['rule_id'])

    # 10. anomaly_signals
    op.create_table(
        'anomaly_signals',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('evidence', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_anomaly_signals_bidder_id', 'anomaly_signals', ['bidder_id'])

    # 11. risk_drivers
    op.create_table(
        'risk_drivers',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('driver', sa.String(length=255), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('source_ref', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_risk_drivers_bidder_id', 'risk_drivers', ['bidder_id'])

    # 12. decisions
    op.create_table(
        'decisions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('finding_id', sa.Uuid(), nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('actor_id', sa.Uuid(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('resulting_status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("action IN ('ACCEPT', 'OVERRIDE', 'CLARIFY', 'CONCUR', 'DISSENT')", name='check_decision_action'),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_decisions_finding_id', 'decisions', ['finding_id'])
    op.create_index('ix_decisions_bidder_id', 'decisions', ['bidder_id'])

    # 13. bidder_links
    op.create_table(
        'bidder_links',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('tender_id', sa.Uuid(), nullable=False),
        sa.Column('bidder_a', sa.Uuid(), nullable=False),
        sa.Column('bidder_b', sa.Uuid(), nullable=False),
        sa.Column('link_type', sa.String(length=100), nullable=False),
        sa.Column('weight', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('evidence', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bidder_a'], ['bidders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bidder_b'], ['bidders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bidder_links_tender_id', 'bidder_links', ['tender_id'])

    # 14. jobs
    op.create_table(
        'jobs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='QUEUED'),
        sa.Column('current_step', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('steps', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_jobs_status_created_at', 'jobs', ['status', 'created_at'])

    # 15. audit_log
    op.create_table(
        'audit_log',
        sa.Column('seq', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actor_id', sa.Uuid(), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('target_type', sa.String(length=100), nullable=False),
        sa.Column('target_id', sa.String(length=255), nullable=False),
        sa.Column('payload', sa.JSON().with_variant(postgresql.JSONB(), 'postgresql'), nullable=True),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('curr_hash', sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint('seq'),
        sa.UniqueConstraint('curr_hash', name='uq_audit_log_curr_hash'),
    )
    op.create_index('ix_audit_log_seq', 'audit_log', ['seq'])

    # 16. reports
    op.create_table(
        'reports',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tender_id', sa.Uuid(), nullable=False),
        sa.Column('bidder_id', sa.Uuid(), nullable=True),
        sa.Column('path', sa.String(length=1000), nullable=False),
        sa.Column('chain_head', sa.String(length=64), nullable=False),
        sa.Column('generated_by', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bidder_id'], ['bidders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reports_tender_id', 'reports', ['tender_id'])

    # 17. kb_chunks
    op.create_table(
        'kb_chunks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source', sa.String(length=255), nullable=False),
        sa.Column('clause', sa.String(length=255), nullable=True),
        sa.Column('url', sa.String(length=1000), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_kb_chunks_source', 'kb_chunks', ['source'])


def downgrade() -> None:
    op.drop_table('kb_chunks')
    op.drop_table('reports')
    op.drop_table('audit_log')
    op.drop_table('jobs')
    op.drop_table('bidder_links')
    op.drop_table('decisions')
    op.drop_table('risk_drivers')
    op.drop_table('anomaly_signals')
    op.drop_table('findings')
    op.drop_table('verification_events')
    op.drop_table('extracted_fields')
    op.drop_table('document_pages')
    op.drop_table('documents')
    op.drop_table('bidders')
    op.drop_table('criteria')
    op.drop_table('tenders')
    op.drop_table('users')
