// import { isWorkingDay } from '@eri/core'; // Assuming core has this

export interface SLAClock {
    id: string;
    type: 'INTERNAL_REVIEW' | 'EXTERNAL_DISPUTE' | 'CUSTOMER_RESPONSE';
    deadline: Date;
}

export interface BreachRecord {
    caseId: string;
    clockId: string;
    deadline: Date;
    breachedAt: Date;
}

export class SLATracker {
    async startClock(caseId: string, clock: SLAClock, db: any): Promise<void> {
        await db.query(
            `INSERT INTO sla_clocks (case_id, clock, started_at, deadline_at, status)
             VALUES ($1, $2, NOW(), $3, 'RUNNING')
             ON CONFLICT DO NOTHING`,
            [caseId, clock.type, clock.deadline]
        );
    }

    async stopClock(caseId: string, clock: SLAClock, stopEvent: string, db: any): Promise<void> {
        await db.query(
            `UPDATE sla_clocks SET status = 'STOPPED', stopped_at = NOW(), stop_event = $1
             WHERE clock = $2 AND case_id = $3 AND status = 'RUNNING'`,
            [stopEvent, clock.type, caseId]
        );
    }

    async checkBreaches(db: any): Promise<BreachRecord[]> {
        const now = new Date();
        const result = await db.query(
            `UPDATE sla_clocks SET status = 'BREACHED'
             WHERE status = 'RUNNING' AND deadline_at < NOW()
             RETURNING case_id, id, deadline_at`,
        );
        return result.rows.map((row: any) => ({
            caseId: row.case_id,
            clockId: row.id,
            deadline: new Date(row.deadline_at),
            breachedAt: now,
        }));
    }

    getApplicableClocks(derivedState: string, amount: number): SLAClock[] {
        const clocks: SLAClock[] = [];
        // Example logic
        if (derivedState === 'INDETERMINATE' || derivedState === 'CONFLICT') {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 2); // 48h working hours
            clocks.push({ id: `int-review-${Date.now()}`, type: 'INTERNAL_REVIEW', deadline });
        }
        return clocks;
    }
}
