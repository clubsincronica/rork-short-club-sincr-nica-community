import { query } from '../db/postgres-client';

export interface BankAccount {
    id?: number;
    userId: number;
    accountType: string;
    accountNumber: string;
    accountHolderName: string;
    bankName?: string;
    countryCode: string;
    isPrimary: boolean;
    percentage?: number;
    nickname?: string;
}

export async function addBankAccount(account: BankAccount) {
    // If this is the primary account, unset others first
    if (account.isPrimary) {
        await query(
            `UPDATE bank_accounts SET is_primary = false WHERE user_id = $1`,
            [account.userId]
        );
    }

    const res = await query(
        `INSERT INTO bank_accounts (
      user_id, account_type, account_number, account_holder_name, 
      bank_name, country_code, is_primary, percentage, nickname,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id`,
        [
            account.userId,
            account.accountType,
            account.accountNumber,
            account.accountHolderName,
            account.bankName || null,
            account.countryCode,
            account.isPrimary || false,
            account.percentage || 0,
            account.nickname || null
        ]
    );
    return { lastID: res[0]?.id ?? null };
}

export async function getBankAccountsByUserId(userId: number) {
    const rows = await query(
        `SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC`,
        [userId]
    );
    return rows || [];
}

export async function updateBankAccount(id: number, userId: number, account: Partial<BankAccount>) {
    if (account.isPrimary) {
        await query(
            `UPDATE bank_accounts SET is_primary = false WHERE user_id = $1`,
            [userId]
        );
    }

    const allowedFields = [
        'account_type', 'account_number', 'account_holder_name',
        'bank_name', 'country_code', 'is_primary', 'percentage', 'nickname'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    Object.entries(account).forEach(([key, value]) => {
        // Convert camelCase to snake_case for DB
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        if (allowedFields.includes(snakeKey)) {
            updates.push(`${snakeKey} = $${paramIdx}`);
            values.push(value);
            paramIdx++;
        }
    });

    if (updates.length === 0) return;

    values.push(id);
    values.push(userId);

    await query(
        `UPDATE bank_accounts SET ${updates.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}`,
        [...values]
    );
}

export async function deleteBankAccount(id: number, userId: number) {
    await query(
        `DELETE FROM bank_accounts WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
}
