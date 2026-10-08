import crypto from 'crypto';
import { Pool } from 'pg';

export interface AuditEntry {
    id?: string;
    caseId: string;
    event: string;
    payload: any;
    prevHash: string;
    hash: string;
    timestamp: Date;
}

export class AuditLedger {
    constructor(private readonly db: Pool) {}

    async append(caseId: string, event: string, payload: object): Promise<string> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [caseId]);

            const result = await client.query<{ hash: string }>(
                'SELECT hash FROM audit_log WHERE case_id = $1 ORDER BY seq DESC LIMIT 1',
                [caseId]
            );
            const prevHash = result.rows[0]?.hash || 'genesis';

        const content = prevHash + JSON.stringify(payload);
        const hash = crypto.createHash('sha256').update(content).digest('hex');

            await client.query(
                `INSERT INTO audit_log (case_id, event, payload, prev_hash, hash)
                 VALUES ($1, $2, $3, $4, $5)`,
                [caseId, event, payload, prevHash, hash]
            );
            await client.query('COMMIT');
            return hash;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getAuditTrail(caseId: string): Promise<AuditEntry[]> {
        const result = await this.db.query(
            `SELECT case_id AS "caseId", event, payload, prev_hash AS "prevHash",
                    hash, at AS timestamp
             FROM audit_log WHERE case_id = $1 ORDER BY seq ASC`,
            [caseId]
        );
        return result.rows;
    }

    async verifyChain(caseId: string): Promise<{ valid: boolean; brokenAt?: number }> {
        const trail = await this.getAuditTrail(caseId);
        
        for (let i = 0; i < trail.length; i++) {
            const entry = trail[i];
            const expectedPrevHash = i > 0 ? trail[i - 1].hash : 'genesis';
            
            if (entry.prevHash !== expectedPrevHash) {
                return { valid: false, brokenAt: i };
            }
            
            const content = entry.prevHash + JSON.stringify(entry.payload);
            const computedHash = crypto.createHash('sha256').update(content).digest('hex');
            
            if (entry.hash !== computedHash) {
                return { valid: false, brokenAt: i };
            }
        }
        
        return { valid: true };
    }
}
