"""Dashboard service aggregating real database metrics for executive and operational intelligence."""

from datetime import datetime, timezone
import logging
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.entities import Tender, Bidder, Finding, Job, AuditLog

logger = logging.getLogger("vigilbid.services.dashboard")


class DashboardService:
    """Computes transparent, real-time procurement metrics directly from relational records."""

    @staticmethod
    async def get_metrics(session: AsyncSession) -> dict[str, Any]:
        """Aggregate total tenders, bidders, verification states, risk/compliance distributions, and job performance."""
        # 1. Total Tenders
        tenders_stmt = select(func.count(Tender.id))
        total_tenders = (await session.execute(tenders_stmt)).scalar() or 0

        # 2. Total Bidders
        bidders_stmt = select(func.count(Bidder.id))
        total_bidders = (await session.execute(bidders_stmt)).scalar() or 0

        # 3. Verified Bidders (Review finalized)
        verified_stmt = select(func.count(Bidder.id)).where(Bidder.review_state == "REVIEW_COMPLETE")
        verified_bidders = (await session.execute(verified_stmt)).scalar() or 0

        # 4. Pending Bidders
        pending_stmt = select(func.count(Bidder.id)).where(Bidder.overall_status == "PENDING")
        pending_bidders = (await session.execute(pending_stmt)).scalar() or 0

        # 5. High Risk Bidders
        high_risk_stmt = select(func.count(Bidder.id)).where(
            (Bidder.risk_band == "HIGH") | (Bidder.risk_score > 60)
        )
        high_risk_bidders = (await session.execute(high_risk_stmt)).scalar() or 0

        # 6. Compliance Distribution (PASS, WARN, REVIEW, FAIL, PENDING)
        compliance_stmt = select(Bidder.overall_status, func.count(Bidder.id)).group_by(Bidder.overall_status)
        compliance_rows = (await session.execute(compliance_stmt)).all()
        compliance_distribution = {"PASS": 0, "WARN": 0, "REVIEW": 0, "FAIL": 0, "PENDING": 0}
        for status, count in compliance_rows:
            if status in compliance_distribution:
                compliance_distribution[status] = count
            else:
                compliance_distribution[status] = count

        # 7. Risk Distribution & Average Risk Score
        risk_stmt = select(Bidder.risk_band, func.count(Bidder.id)).group_by(Bidder.risk_band)
        risk_rows = (await session.execute(risk_stmt)).all()
        risk_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
        for band, count in risk_rows:
            if band in risk_distribution:
                risk_distribution[band] = count
            else:
                risk_distribution[band] = count

        avg_risk_stmt = select(func.avg(Bidder.risk_score))
        avg_risk_raw = (await session.execute(avg_risk_stmt)).scalar()
        avg_risk_score = round(float(avg_risk_raw), 1) if avg_risk_raw is not None else 0.0

        # 8. Finding Counts
        finding_stmt = select(Finding.status, func.count(Finding.id)).group_by(Finding.status)
        finding_rows = (await session.execute(finding_stmt)).all()
        finding_counts = {"TOTAL": 0, "PASS": 0, "WARN": 0, "REVIEW": 0, "FAIL": 0}
        total_findings = 0
        for f_status, count in finding_rows:
            total_findings += count
            if f_status in finding_counts:
                finding_counts[f_status] = count
        finding_counts["TOTAL"] = total_findings

        # Top flagged rules
        flagged_rules_stmt = (
            select(Finding.rule_id, func.count(Finding.id))
            .where(Finding.status.in_(["FAIL", "REVIEW", "WARN"]))
            .group_by(Finding.rule_id)
            .order_by(func.count(Finding.id).desc())
            .limit(5)
        )
        flagged_rules = dict((await session.execute(flagged_rules_stmt)).all())
        finding_counts["top_flagged_rules"] = flagged_rules

        # 9. Processing Performance
        total_jobs_stmt = select(func.count(Job.id))
        total_jobs = (await session.execute(total_jobs_stmt)).scalar() or 0

        done_jobs_stmt = select(func.count(Job.id)).where(Job.status == "DONE")
        completed_jobs = (await session.execute(done_jobs_stmt)).scalar() or 0

        failed_jobs_stmt = select(func.count(Job.id)).where(Job.status == "FAILED")
        failed_jobs = (await session.execute(failed_jobs_stmt)).scalar() or 0

        running_jobs_stmt = select(func.count(Job.id)).where(Job.status.in_(["RUNNING", "PROCESSING", "QUEUED"]))
        active_jobs = (await session.execute(running_jobs_stmt)).scalar() or 0

        # Audit events count
        audit_events_stmt = select(func.count(AuditLog.seq))
        total_audit_events = (await session.execute(audit_events_stmt)).scalar() or 0

        processing_performance = {
            "total_jobs": total_jobs,
            "completed_jobs": completed_jobs,
            "failed_jobs": failed_jobs,
            "active_jobs": active_jobs,
            "total_audit_events": total_audit_events,
            "success_rate_percent": round((completed_jobs / total_jobs * 100), 1) if total_jobs > 0 else 100.0,
        }

        return {
            "total_tenders": total_tenders,
            "total_bidders": total_bidders,
            "verified_bidders": verified_bidders,
            "pending_bidders": pending_bidders,
            "high_risk_bidders": high_risk_bidders,
            "compliance_distribution": compliance_distribution,
            "risk_distribution": risk_distribution,
            "avg_risk_score": avg_risk_score,
            "finding_counts": finding_counts,
            "processing_performance": processing_performance,
        }
