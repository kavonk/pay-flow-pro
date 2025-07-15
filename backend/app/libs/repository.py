import asyncpg
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date, timezone
import json

from app.libs.database import get_db_connection
# This is a comment to trigger a refresh of main.py
from app.libs.models import (
    Customer, Invoice, Payment, DunningRule,
    InvoiceStatus, DunningChannel, Currency, PaymentMethod,
    SubscriptionPlan, UserSubscription, BillingHistory, SubscriptionStatus, 
    BillingStatus, BillingReason, PayoutAccount, PayoutAccountStatus,
    Account, UserAccount, UserRole, TeamInvitation
)

class PaymentRepository:
    """Repository class for payment platform database operations with multi-tenant support."""
    
    def __init__(self, user_id: str, account_id: Optional[UUID] = None):
        """Initialize repository with user and account context for multi-tenant support."""
        self.user_id = user_id
        self.account_id = account_id
        
    async def _get_user_account_id(self) -> UUID:
        """Get account_id for the current user. Uses cached value or queries database.
        If no account exists, creates a default account for the user (self-healing)."""
        if self.account_id:
            return self.account_id
        
        # Query the user's default account (first account they're a member of)
        query = """
            SELECT ua.account_id 
            FROM user_accounts ua 
            WHERE ua.user_id = $1 
            ORDER BY ua.created_at ASC 
            LIMIT 1
        """
        rows = await self._execute_query(query, self.user_id)
        
        if rows:
            self.account_id = rows[0]['account_id']
            return self.account_id
        
        # No account found - create a default account for this user (self-healing)
        print(f"No account found for user {self.user_id}, creating default account...")
        account_id = await self._create_default_account_for_user()
        self.account_id = account_id
        return self.account_id
    
    async def _create_default_account_for_user(self) -> UUID:
        """Create a default account for a user who doesn't have one (self-healing)."""
        from uuid import uuid4
        import re
        
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Check if account was created between our check and now (race condition)
                recheck_query = """
                    SELECT ua.account_id 
                    FROM user_accounts ua 
                    WHERE ua.user_id = $1 
                    ORDER BY ua.created_at ASC 
                    LIMIT 1
                """
                existing_rows = await conn.fetch(recheck_query, self.user_id)
                if existing_rows:
                    print(f"Account was created concurrently for user {self.user_id}, using existing account")
                    return existing_rows[0]['account_id']
                
                # Generate a unique account name and slug for the user
                account_id = uuid4()
                account_name = f"Account for {self.user_id[:8]}"
                
                # Create a guaranteed unique slug using user ID + account UUID
                base_slug = re.sub(r'[^a-z0-9-]', '-', self.user_id.lower())[:12]
                account_slug = f"{base_slug}-{str(account_id)[:8]}"
                
                # Create the account
                account_query = """
                    INSERT INTO accounts (id, name, slug, created_at, updated_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
                await conn.execute(account_query, account_id, account_name, account_slug)
                
                # Create the user account membership with admin role
                user_account_id = uuid4()
                user_account_query = """
                    INSERT INTO user_accounts (id, user_id, account_id, role, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
                await conn.execute(
                    user_account_query, user_account_id, self.user_id, 
                    account_id, UserRole.ADMIN.value
                )
                
                print(f"Created default account {account_id} for user {self.user_id} with admin role")
                return account_id
        except Exception as e:
            # If account creation fails due to race condition, try to get existing account
            if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
                print(f"Duplicate account creation detected for user {self.user_id}, fetching existing account")
                fallback_query = """
                    SELECT ua.account_id 
                    FROM user_accounts ua 
                    WHERE ua.user_id = $1 
                    ORDER BY ua.created_at ASC 
                    LIMIT 1
                """
                fallback_rows = await conn.fetch(fallback_query, self.user_id)
                if fallback_rows:
                    return fallback_rows[0]['account_id']
            raise  # Re-raise if not a duplicate key error
        finally:
            await conn.close()
    
    async def _execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute a query and return results as list of dictionaries."""
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
        finally:
            await conn.close()
    
    async def _execute_in_transaction(self, operations) -> Any:
        """Execute multiple operations in a single transaction with user-level advisory lock."""
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Acquire advisory lock based on user_id hash to prevent concurrent subscription operations
                # Use CRC32 hash of user_id to get a numeric lock ID
                import zlib
                lock_id = zlib.crc32(self.user_id.encode('utf-8')) & 0x7FFFFFFF  # Ensure positive int32
                
                print(f"Acquiring advisory lock {lock_id} for user {self.user_id}")
                await conn.execute("SELECT pg_advisory_xact_lock($1)", lock_id)
                print(f"Advisory lock {lock_id} acquired for user {self.user_id}")
                
                # Execute the operations
                return await operations(conn)
        finally:
            await conn.close()
    
    async def _execute_command(self, query: str, *args) -> str:
        """Execute a command (INSERT/UPDATE/DELETE) and return status."""
        conn = await get_db_connection()
        try:
            result = await conn.execute(query, *args)
            return result
        finally:
            await conn.close()
    
    # Customer operations
    async def create_customer(self, customer: Customer) -> Customer:
        """Create a new customer in the database."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO customers (id, user_id, account_id, name, email, phone, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        """
        rows = await self._execute_query(
            query, customer.id, self.user_id, account_id, customer.name, customer.email,
            customer.phone, customer.notes, customer.created_at, customer.updated_at
        )
        return self._row_to_customer(rows[0])
    
    async def get_customer(self, customer_id: UUID) -> Optional[Customer]:
        """Get a customer by ID (scoped to current account)."""
        account_id = await self._get_user_account_id()
        query = "SELECT * FROM customers WHERE id = $1 AND account_id = $2"
        rows = await self._execute_query(query, customer_id, account_id)
        return self._row_to_customer(rows[0]) if rows else None
    
    async def get_customers(self, limit: int = 100, offset: int = 0, search: Optional[str] = None) -> List[Customer]:
        """Get all customers for the current account with optional search."""
        account_id = await self._get_user_account_id()
        
        if search and search.strip():
            search_term = search.strip()
            
            # Use hybrid search: exact matches for email/phone + full-text search
            query = """
                SELECT *, 
                    CASE 
                        WHEN email ILIKE $4 THEN 1.0
                        WHEN phone ILIKE $4 THEN 0.9
                        WHEN name ILIKE $4 THEN 0.8
                        ELSE ts_rank(search_vector, plainto_tsquery('english', $4))
                    END as rank
                FROM customers 
                WHERE account_id = $1 
                AND (
                    email ILIKE $4 
                    OR phone ILIKE $4 
                    OR name ILIKE $4
                    OR search_vector @@ plainto_tsquery('english', $4)
                )
                ORDER BY rank DESC, created_at DESC 
                LIMIT $2 OFFSET $3
            """
            # Use wildcards for partial matching
            search_pattern = f"%{search_term}%"
            rows = await self._execute_query(query, account_id, limit, offset, search_pattern)
        else:
            # Regular query without search
            query = """
                SELECT * FROM customers 
                WHERE account_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            """
            rows = await self._execute_query(query, account_id, limit, offset)
            
        return [self._row_to_customer(row) for row in rows]
    
    async def update_customer(self, customer: Customer) -> Customer:
        """Update an existing customer."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE customers 
            SET name = $3, email = $4, phone = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND account_id = $2
            RETURNING *
        """
        rows = await self._execute_query(
            query, customer.id, account_id, customer.name, 
            customer.email, customer.phone, customer.notes
        )
        return self._row_to_customer(rows[0]) if rows else None
    
    async def delete_customer(self, customer_id: UUID) -> bool:
        """Delete a customer (scoped to current account)."""
        account_id = await self._get_user_account_id()
        query = "DELETE FROM customers WHERE id = $1 AND account_id = $2"
        result = await self._execute_command(query, customer_id, account_id)
        return "DELETE 1" in result
    
    # Invoice operations
    async def create_invoice(self, invoice: Invoice) -> Invoice:
        """Create a new invoice in the database."""
        # Use repository's account_id for consistency and multi-tenant security
        account_id = await self._get_user_account_id()
        
        query = """
            INSERT INTO invoices (id, user_id, account_id, customer_id, amount, currency, issue_date, 
                                due_date, description, invoice_number, terms, notes, status, stripe_payment_link_id, stripe_payment_link_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        """
        rows = await self._execute_query(
            query, invoice.id, self.user_id, account_id, invoice.customer_id, invoice.amount,
            invoice.currency.value, invoice.issue_date, invoice.due_date, 
            invoice.description, invoice.invoice_number, invoice.terms, invoice.notes,
            invoice.status.value, invoice.stripe_payment_link_id, 
            invoice.stripe_payment_link_url, invoice.created_at, invoice.updated_at
        )
        return self._row_to_invoice(rows[0])
    
    async def get_invoice(self, invoice_id: UUID) -> Optional[Invoice]:
        """Get an invoice by ID (scoped to current account)."""
        account_id = await self._get_user_account_id()
        query = "SELECT * FROM invoices WHERE id = $1 AND account_id = $2"
        rows = await self._execute_query(query, invoice_id, account_id)
        return self._row_to_invoice(rows[0]) if rows else None
    
    async def get_invoices(self, customer_id: Optional[UUID] = None, 
                          status: Optional[InvoiceStatus] = None,
                          search: Optional[str] = None,
                          limit: int = 100, offset: int = 0) -> List[Invoice]:
        """Get invoices for the current account with optional filters and search."""
        account_id = await self._get_user_account_id()
        
        if search and search.strip():
            # Use materialized view for search with customer data
            query = "SELECT *, ts_rank(search_vector, plainto_tsquery('english', $" + str(len([account_id]) + 1) + ")) as rank FROM invoice_search_view WHERE account_id = $1"
            params = [account_id, search]
        else:
            # Regular query without search
            query = "SELECT * FROM invoices WHERE account_id = $1"
            params = [account_id]
        
        if customer_id:
            query += " AND customer_id = $" + str(len(params) + 1)
            params.append(customer_id)
        
        if status:
            query += " AND status = $" + str(len(params) + 1)
            params.append(status.value)
        
        if search and search.strip():
            query += " AND search_vector @@ plainto_tsquery('english', $2)"
            query += " ORDER BY rank DESC, created_at DESC"
        else:
            query += " ORDER BY created_at DESC"
            
        query += " LIMIT $" + str(len(params) + 1) + " OFFSET $" + str(len(params) + 2)
        params.extend([limit, offset])
        
        rows = await self._execute_query(query, *params)
        return [self._row_to_invoice(row) for row in rows]
    
    async def get_invoices_with_customers(self, customer_id: Optional[UUID] = None, 
                                         status: Optional[InvoiceStatus] = None,
                                         search: Optional[str] = None,
                                         issue_date_after: Optional[date] = None,
                                         issue_date_before: Optional[date] = None,
                                         due_date_after: Optional[date] = None,
                                         due_date_before: Optional[date] = None,
                                         sort_by: str = "created_at",
                                         sort_order: str = "desc",
                                         limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get invoices with customer data in a single query for better performance."""
        account_id = await self._get_user_account_id()
        
        if search and search.strip():
            # Use materialized view for search
            query = """
                SELECT 
                    id, user_id, customer_id, amount, currency, 
                    issue_date, due_date, description, status, updated_at,
                    created_at, customer_name, customer_email,
                    ts_rank(search_vector, plainto_tsquery('english', $2)) as rank
                FROM invoice_search_view
                WHERE account_id = $1
                AND search_vector @@ plainto_tsquery('english', $2)
            """
            params = [account_id, search]
        else:
            # Regular query without search
            query = """
                SELECT 
                    i.id, i.user_id, i.customer_id, i.amount, i.currency, 
                    i.issue_date, i.due_date, i.description, i.status, i.updated_at,
                    i.stripe_payment_link_id, i.stripe_payment_link_url, 
                    i.created_at, i.updated_at,
                    COALESCE(c.name, 'Unknown Customer') as customer_name, 
                    COALESCE(c.email, 'no-email@unknown.com') as customer_email
                FROM invoices i
                LEFT JOIN customers c ON i.customer_id = c.id AND c.account_id = i.account_id
                WHERE i.account_id = $1
            """
            params = [account_id]
        
        if customer_id:
            query += " AND " + ("customer_id" if search else "i.customer_id") + " = $" + str(len(params) + 1)
            params.append(customer_id)
        
        if status:
            query += " AND " + ("status" if search else "i.status") + " = $" + str(len(params) + 1)
            params.append(status.value)
        
        # Date range filters
        if issue_date_after:
            query += " AND " + ("issue_date" if search else "i.issue_date") + " >= $" + str(len(params) + 1)
            params.append(issue_date_after)
        
        if issue_date_before:
            query += " AND " + ("issue_date" if search else "i.issue_date") + " <= $" + str(len(params) + 1)
            params.append(issue_date_before)
        
        if due_date_after:
            query += " AND " + ("due_date" if search else "i.due_date") + " >= $" + str(len(params) + 1)
            params.append(due_date_after)
        
        if due_date_before:
            query += " AND " + ("due_date" if search else "i.due_date") + " <= $" + str(len(params) + 1)
            params.append(due_date_before)
        
        # Sorting
        sort_mapping = {
            "created_at": "created_at" if search else "i.created_at",
            "issue_date": "issue_date" if search else "i.issue_date", 
            "due_date": "due_date" if search else "i.due_date",
            "amount": "amount" if search else "i.amount",
            "status": "status" if search else "i.status",
            "customer_name": "customer_name"
        }
        
        sort_field = sort_mapping.get(sort_by, sort_mapping["created_at"])
        
        if search and search.strip():
            # For search queries, include rank in sorting
            query += f" ORDER BY rank DESC, {sort_field} {sort_order.upper()}"
        else:
            query += f" ORDER BY {sort_field} {sort_order.upper()}"
            
        query += " LIMIT $" + str(len(params) + 1) + " OFFSET $" + str(len(params) + 2)
        params.extend([limit, offset])
        
        rows = await self._execute_query(query, *params)
        return [dict(row) for row in rows]
    
    async def update_invoice_status(self, invoice_id: UUID, status: InvoiceStatus) -> bool:
        """Update invoice status."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE invoices 
            SET status = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND account_id = $2
        """
        result = await self._execute_command(query, invoice_id, account_id, status.value)
        return "UPDATE 1" in result
    
    async def update_invoice(self, invoice: Invoice) -> Optional[Invoice]:
        """Update an existing invoice."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE invoices 
            SET customer_id = $3, amount = $4, currency = $5, issue_date = $6,
                due_date = $7, description = $8, status = $9, stripe_payment_link_id = $10, 
                stripe_payment_link_url = $11, invoice_number = $12, terms = $13, notes = $14,
                line_items = $15, invoice_wide_tax_rate = $16, discount_type = $17, 
                discount_value = $18, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND account_id = $2
            RETURNING *
        """
        rows = await self._execute_query(
            query, invoice.id, account_id, invoice.customer_id, invoice.amount,
            invoice.currency.value, invoice.issue_date, invoice.due_date,
            invoice.description, invoice.status.value, invoice.stripe_payment_link_id, 
            invoice.stripe_payment_link_url, invoice.invoice_number, invoice.terms,
            invoice.notes, invoice.line_items, invoice.invoice_wide_tax_rate,
            invoice.discount_type, invoice.discount_value
        )
        return self._row_to_invoice(rows[0]) if rows else None
    
    async def get_overdue_invoices(self) -> List[Invoice]:
        """Get all overdue invoices for the current account."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT * FROM invoices 
            WHERE account_id = $1 
            AND due_date < CURRENT_DATE 
            AND status NOT IN ('paid', 'cancelled')
            ORDER BY due_date ASC
        """
        rows = await self._execute_query(query, account_id)
        return [self._row_to_invoice(row) for row in rows]
    
    # Payment operations
    async def create_payment(self, payment: Payment) -> Payment:
        """Create a new payment record."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO payments (id, user_id, account_id, invoice_id, method, amount, currency,
                                transaction_id, notes, timestamp, stripe_payment_id, 
                                created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        """
        rows = await self._execute_query(
            query, payment.id, self.user_id, account_id, payment.invoice_id, payment.method.value,
            payment.amount, payment.currency, payment.transaction_id, payment.notes,
            payment.timestamp, payment.stripe_payment_id,
            payment.created_at, payment.updated_at
        )
        return self._row_to_payment(rows[0])
    
    async def get_payments_for_invoice(self, invoice_id: UUID) -> List[Payment]:
        """Get all payments for a specific invoice."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT * FROM payments 
            WHERE invoice_id = $1 AND account_id = $2
            ORDER BY timestamp DESC
        """
        rows = await self._execute_query(query, invoice_id, account_id)
        return [self._row_to_payment(row) for row in rows]
    
    async def get_recent_payments(self, limit: int = 10) -> List[Payment]:
        """Get recent payments for the current account."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT * FROM payments 
            WHERE account_id = $1
            ORDER BY timestamp DESC 
            LIMIT $2
        """
        rows = await self._execute_query(query, account_id, limit)
        return [self._row_to_payment(row) for row in rows]
    
    # Dunning rule operations
    async def create_dunning_rule(self, rule: DunningRule) -> DunningRule:
        """Create a new dunning rule."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO dunning_rules (id, user_id, account_id, name, offset_days, channel, 
                                     message, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        """
        rows = await self._execute_query(
            query, rule.id, self.user_id, account_id, rule.name, rule.offset_days,
            rule.channel.value, rule.message, rule.is_active,
            rule.created_at, rule.updated_at
        )
        return self._row_to_dunning_rule(rows[0])
    
    async def get_active_dunning_rules(self) -> List[DunningRule]:
        """Get all active dunning rules for the current account."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT * FROM dunning_rules 
            WHERE account_id = $1 AND is_active = true
            ORDER BY offset_days ASC
        """
        rows = await self._execute_query(query, account_id)
        return [self._row_to_dunning_rule(row) for row in rows]
    
    async def toggle_dunning_rule(self, rule_id: UUID, is_active: bool) -> bool:
        """Enable or disable a dunning rule."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE dunning_rules 
            SET is_active = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND account_id = $2
        """
        result = await self._execute_command(query, rule_id, account_id, is_active)
        return "UPDATE 1" in result
    
    # Analytics and reporting
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get dashboard metrics for the current account."""
        account_id = await self._get_user_account_id()
        conn = await get_db_connection()
        try:
            # Total revenue this month
            revenue_query = """
                SELECT COALESCE(SUM(p.amount), 0) as total_revenue
                FROM payments p
                WHERE p.account_id = $1 
                AND DATE_TRUNC('month', p.timestamp) = DATE_TRUNC('month', CURRENT_DATE)
            """
            revenue_result = await conn.fetchrow(revenue_query, account_id)
            
            # Outstanding amount
            outstanding_query = """
                SELECT COALESCE(SUM(i.amount), 0) as outstanding
                FROM invoices i
                WHERE i.account_id = $1 
                AND i.status NOT IN ('paid', 'cancelled')
            """
            outstanding_result = await conn.fetchrow(outstanding_query, account_id)
            
            # Paid invoices this month
            paid_invoices_query = """
                SELECT COUNT(*) as paid_invoices
                FROM invoices i
                WHERE i.account_id = $1 
                AND i.status = 'paid'
                AND DATE_TRUNC('month', i.updated_at) = DATE_TRUNC('month', CURRENT_DATE)
            """
            paid_result = await conn.fetchrow(paid_invoices_query, account_id)
            
            # Active customers
            customers_query = """
                SELECT COUNT(*) as active_customers
                FROM customers c
                WHERE c.account_id = $1
            """
            customers_result = await conn.fetchrow(customers_query, account_id)
            
            return {
                "total_revenue": float(revenue_result['total_revenue']),
                "outstanding": float(outstanding_result['outstanding']),
                "paid_invoices": int(paid_result['paid_invoices']),
                "active_customers": int(customers_result['active_customers'])
            }
        finally:
            await conn.close()
            
    # Financial stats
    async def get_financial_stats(self) -> Dict[str, Any]:
        """Get financial statistics for the current account."""
        account_id = await self._get_user_account_id()
        conn = await get_db_connection()
        try:
            # Get total outstanding amount
            outstanding_result = await conn.fetchrow(
                "SELECT COALESCE(SUM(amount), 0) as outstanding FROM invoices WHERE account_id = $1 AND status IN ('draft', 'sent', 'overdue')",
                account_id
            )
            
            # Get total received amount (from payments)
            received_result = await conn.fetchrow(
                "SELECT COALESCE(SUM(amount), 0) as received FROM payments WHERE account_id = $1",
                account_id
            )
            
            # Get overdue invoices count
            overdue_result = await conn.fetchrow(
                "SELECT COUNT(*) as overdue_invoices FROM invoices WHERE account_id = $1 AND due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')",
                account_id
            )
            
            # Get paid invoices count
            paid_result = await conn.fetchrow(
                "SELECT COUNT(*) as paid_invoices FROM invoices WHERE account_id = $1 AND status = 'paid'",
                account_id
            )
            
            # Get active customers count
            customers_result = await conn.fetchrow(
                "SELECT COUNT(*) as active_customers FROM customers WHERE account_id = $1",
                account_id
            )
            
            return {
                "total_outstanding": float(outstanding_result['outstanding']),
                "total_received": float(received_result['received']),
                "overdue_invoices": int(overdue_result['overdue_invoices']),
                "paid_invoices": int(paid_result['paid_invoices']),
                "active_customers": int(customers_result['active_customers'])
            }
        finally:
            await conn.close()
    
    # Subscription operations
    async def get_or_create_stripe_customer(self, user_email: Optional[str] = None) -> str:
        """
        Get existing Stripe customer ID for the user's account or create a new one.
        Also creates a mapping in user_stripe_mapping table.
        """
        account_id = await self._get_user_account_id()
        
        # 1. Check for existing subscription and customer ID
        subscription = await self.get_user_subscription()
        if subscription and subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        # 2. Check user_stripe_mapping table
        mapping_query = "SELECT stripe_customer_id FROM user_stripe_mapping WHERE user_id = $1"
        mapping_rows = await self._execute_query(mapping_query, self.user_id)
        if mapping_rows:
            return mapping_rows[0]['stripe_customer_id']

        # 3. If not found, create a new Stripe customer
        import stripe
        customer = stripe.Customer.create(
            email=user_email,
            metadata={
                'user_id': self.user_id,
                'account_id': str(account_id)
            }
        )
        stripe_customer_id = customer.id

        # 4. Store the new mapping
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Insert into mapping table
                map_insert_query = """
                    INSERT INTO user_stripe_mapping (user_id, stripe_customer_id)
                    VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE 
                    SET stripe_customer_id = EXCLUDED.stripe_customer_id;
                """
                await conn.execute(map_insert_query, self.user_id, stripe_customer_id)

                # Update subscription if it exists
                if subscription:
                    sub_update_query = """
                        UPDATE user_subscriptions 
                        SET stripe_customer_id = $1 
                        WHERE id = $2
                    """
                    await conn.execute(sub_update_query, stripe_customer_id, subscription.id)
        finally:
            await conn.close()
        
        return stripe_customer_id

    async def get_user_subscription(self) -> Optional[UserSubscription]:
        """Get current user's subscription."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price_monthly, p.features,
                   p.has_custom_branding, p.has_priority_support, p.has_recurring_billing
            FROM user_subscriptions s
            LEFT JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.account_id = $1
        """
        rows = await self._execute_query(query, account_id)
        return self._row_to_user_subscription(rows[0]) if rows else None
    
    async def get_user_by_stripe_customer_id(self, stripe_customer_id: str) -> Optional[str]:
        """Get user_id from stripe_customer_id."""
        query = "SELECT user_id FROM user_stripe_mapping WHERE stripe_customer_id = $1"
        rows = await self._execute_query(query, stripe_customer_id)
        return rows[0]['user_id'] if rows else None

    async def get_or_create_subscription_atomic(self, subscription_factory) -> UserSubscription:
        """Atomically get existing subscription or create new one with proper locking."""
        async def _operation(conn):
            account_id = await self._get_user_account_id()
            
            # Check for existing subscription within the transaction
            query = """
                SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price_monthly, p.features,
                       p.has_custom_branding, p.has_priority_support, p.has_recurring_billing
                FROM user_subscriptions s
                LEFT JOIN subscription_plans p ON s.plan_id = p.id
                WHERE s.account_id = $1
            """
            rows = await conn.fetch(query, account_id)
            
            if rows:
                print(f"Found existing subscription for user {self.user_id} within transaction")
                return self._row_to_user_subscription(rows[0])
            
            # No subscription found, create new one
            print(f"Creating new subscription for user {self.user_id} within transaction")
            subscription = await subscription_factory()
            
            create_query = """
                INSERT INTO user_subscriptions (id, user_id, account_id, plan_id, status, trial_start_date, trial_end_date,
                                              current_period_start, current_period_end, stripe_subscription_id,
                                              stripe_customer_id, card_last_four, card_brand, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            """
            create_rows = await conn.fetch(
                create_query, subscription.id, self.user_id, account_id, subscription.plan_id, subscription.status.value,
                subscription.trial_start_date, subscription.trial_end_date, subscription.current_period_start,
                subscription.current_period_end, subscription.stripe_subscription_id, subscription.stripe_customer_id,
                subscription.card_last_four, subscription.card_brand, subscription.created_at, subscription.updated_at
            )
            
            print(f"Successfully created subscription for user {self.user_id} within transaction")
            return self._row_to_user_subscription(create_rows[0])
        
        return await self._execute_in_transaction(_operation)
    
    async def create_user_subscription(self, subscription: UserSubscription) -> UserSubscription:
        """Create a new user subscription."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO user_subscriptions (id, user_id, account_id, plan_id, status, trial_start_date, trial_end_date,
                                          current_period_start, current_period_end, stripe_subscription_id,
                                          stripe_customer_id, card_last_four, card_brand, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        """
        rows = await self._execute_query(
            query, subscription.id, self.user_id, account_id, subscription.plan_id, subscription.status.value,
            subscription.trial_start_date, subscription.trial_end_date, subscription.current_period_start,
            subscription.current_period_end, subscription.stripe_subscription_id, subscription.stripe_customer_id,
            subscription.card_last_four, subscription.card_brand, subscription.created_at, subscription.updated_at
        )
        return self._row_to_user_subscription(rows[0])
    
    async def update_user_subscription(self, subscription: UserSubscription) -> Optional[UserSubscription]:
        """Update user subscription."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE user_subscriptions SET plan_id = $4, status = $5, trial_start_date = $6, trial_end_date = $7,
                   current_period_start = $8, current_period_end = $9, stripe_subscription_id = $10,
                   stripe_customer_id = $11, card_last_four = $12, card_brand = $13, canceled_at = $14,
                   cancel_at_period_end = $15, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2 AND account_id = $3
            RETURNING *
        """
        rows = await self._execute_query(
            query, subscription.id, self.user_id, account_id, subscription.plan_id, subscription.status.value,
            subscription.trial_start_date, subscription.trial_end_date, subscription.current_period_start,
            subscription.current_period_end, subscription.stripe_subscription_id, subscription.stripe_customer_id,
            subscription.card_last_four, subscription.card_brand, subscription.canceled_at, subscription.cancel_at_period_end
        )
        return self._row_to_user_subscription(rows[0]) if rows else None
    
    async def get_subscription_plans(self, active_only: bool = True) -> List[SubscriptionPlan]:
        """Get available subscription plans."""
        # Use explicit column list to avoid cached statement issues after schema changes
        query = """
            SELECT id, name, slug, description, price_monthly, price_yearly, 
                   stripe_price_id_monthly, stripe_price_id_yearly, stripe_product_id,
                   features, transaction_fee_percentage, max_invoices_per_month, 
                   max_customers, max_seats, has_custom_branding, has_priority_support,
                   has_recurring_billing, has_mobile_payments, has_bulk_send, 
                   has_analytics, has_white_label, has_dedicated_support, 
                   has_premium_api, has_qr_codes, bulk_send_limit, is_active, 
                   created_at, updated_at
            FROM subscription_plans
        """
        params = []
        
        if active_only:
            query += " WHERE is_active = $1"
            params.append(True)
        
        query += " ORDER BY price_monthly ASC"
        rows = await self._execute_query(query, *params)
        return [self._row_to_subscription_plan(row) for row in rows]
    
    async def get_subscription_plan_by_slug(self, slug: str) -> Optional[SubscriptionPlan]:
        """Get subscription plan by slug."""
        query = "SELECT * FROM subscription_plans WHERE slug = $1 AND is_active = $2"
        rows = await self._execute_query(query, slug, True)
        return self._row_to_subscription_plan(rows[0]) if rows else None
    
    async def get_subscription_plan_by_id(self, plan_id: UUID) -> Optional[SubscriptionPlan]:
        """Get subscription plan by ID."""
        query = "SELECT * FROM subscription_plans WHERE id = $1 AND is_active = $2"
        rows = await self._execute_query(query, plan_id, True)
        return self._row_to_subscription_plan(rows[0]) if rows else None
    
    async def create_billing_history(self, billing: BillingHistory) -> BillingHistory:
        """Create billing history record."""
        query = """
            INSERT INTO billing_history (id, user_id, subscription_id, amount, currency, status,
                                       stripe_invoice_id, stripe_payment_intent_id, billing_reason,
                                       period_start, period_end, paid_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        """
        rows = await self._execute_query(
            query, billing.id, self.user_id, billing.subscription_id, billing.amount, billing.currency,
            billing.status.value, billing.stripe_invoice_id, billing.stripe_payment_intent_id,
            billing.billing_reason.value if billing.billing_reason else None,
            billing.period_start, billing.period_end, billing.paid_at, billing.created_at
        )
        return self._row_to_billing_history(rows[0])
    
    async def get_billing_history(self, limit: int = 50, offset: int = 0) -> List[BillingHistory]:
        """Get billing history for the current user."""
        query = """
            SELECT * FROM billing_history 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        """
        rows = await self._execute_query(query, self.user_id, limit, offset)
        return [self._row_to_billing_history(row) for row in rows]

    # Payout Account operations
    async def create_payout_account(self, payout_account: PayoutAccount) -> PayoutAccount:
        """Create a new payout account."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO payout_accounts (
                id, user_id, account_id, stripe_account_id, account_status, business_type,
                country, email, requirements_currently_due, requirements_past_due,
                charges_enabled, payouts_enabled, details_submitted,
                external_account_id, capabilities, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        """
        rows = await self._execute_query(
            query, payout_account.id, self.user_id, account_id, payout_account.stripe_account_id,
            payout_account.account_status.value, payout_account.business_type,
            payout_account.country, payout_account.email,
            payout_account.requirements_currently_due, payout_account.requirements_past_due,
            payout_account.charges_enabled, payout_account.payouts_enabled,
            payout_account.details_submitted, payout_account.external_account_id,
            json.dumps(payout_account.capabilities) if payout_account.capabilities else '{}', 
            payout_account.created_at, payout_account.updated_at
        )
        return self._row_to_payout_account(rows[0])
    
    async def get_payout_account(self) -> Optional[PayoutAccount]:
        """Get the account's payout account."""
        account_id = await self._get_user_account_id()
        query = "SELECT * FROM payout_accounts WHERE account_id = $1"
        rows = await self._execute_query(query, account_id)
        return self._row_to_payout_account(rows[0]) if rows else None
    
    async def update_payout_account(self, payout_account: PayoutAccount) -> PayoutAccount:
        """Update an existing payout account."""
        account_id = await self._get_user_account_id()
        query = """
            UPDATE payout_accounts SET
                account_status = $4,
                business_type = $5,
                email = $6,
                requirements_currently_due = $7,
                requirements_past_due = $8,
                charges_enabled = $9,
                payouts_enabled = $10,
                details_submitted = $11,
                external_account_id = $12,
                capabilities = $13,
                updated_at = $14
            WHERE account_id = $1 AND stripe_account_id = $2 AND user_id = $3
            RETURNING *
        """
        rows = await self._execute_query(
            query, account_id, payout_account.stripe_account_id, self.user_id,
            payout_account.account_status.value, payout_account.business_type,
            payout_account.email, payout_account.requirements_currently_due,
            payout_account.requirements_past_due, payout_account.charges_enabled,
            payout_account.payouts_enabled, payout_account.details_submitted,
            payout_account.external_account_id, json.dumps(payout_account.capabilities) if payout_account.capabilities else '{}',
            payout_account.updated_at
        )
        return self._row_to_payout_account(rows[0]) if rows else None
    
    # Helper methods to convert database rows to models
    def _row_to_customer(self, row: Dict[str, Any]) -> Customer:
        """Convert database row to Customer model."""
        return Customer(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            name=row['name'],
            email=row['email'],
            phone=row['phone'],
            notes=row['notes'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def _row_to_invoice(self, row: Dict[str, Any]) -> Invoice:
        """Convert database row to Invoice model."""
        return Invoice(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            customer_id=row['customer_id'],
            amount=row['amount'],
            currency=Currency(row['currency']),
            issue_date=row['issue_date'],
            due_date=row['due_date'],
            description=row.get('description'),
            invoice_number=row.get('invoice_number'),
            terms=row.get('terms'),
            notes=row.get('notes'),
            line_items=row.get('line_items'),
            invoice_wide_tax_rate=row.get('invoice_wide_tax_rate'),
            discount_type=row.get('discount_type'),
            discount_value=row.get('discount_value'),
            status=InvoiceStatus(row['status']),
            stripe_payment_link_id=row.get('stripe_payment_link_id'),
            stripe_payment_link_url=row.get('stripe_payment_link_url'),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def _row_to_payment(self, row: Dict[str, Any]) -> Payment:
        """Convert database row to Payment model."""
        return Payment(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            invoice_id=row['invoice_id'],
            method=PaymentMethod(row['method']),
            amount=row['amount'],
            currency=row.get('currency', 'EUR'),
            transaction_id=row.get('transaction_id'),
            notes=row.get('notes'),
            timestamp=row['timestamp'],
            stripe_payment_id=row['stripe_payment_id'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def _row_to_dunning_rule(self, row: Dict[str, Any]) -> DunningRule:
        """Convert database row to DunningRule model."""
        return DunningRule(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            name=row['name'],
            offset_days=row['offset_days'],
            channel=DunningChannel(row['channel']),
            message=row['message'],
            is_active=row.get('is_active', True),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def _row_to_subscription_plan(self, row: Dict[str, Any]) -> SubscriptionPlan:
        """Convert database row to SubscriptionPlan model."""
        # Parse features from JSONB
        features = row.get('features', [])
        if isinstance(features, str):
            import json
            features = json.loads(features)
        
        return SubscriptionPlan(
            id=row['id'],
            name=row['name'],
            slug=row['slug'],
            description=row.get('description'),
            price_monthly=row['price_monthly'],
            price_yearly=row.get('price_yearly'),
            stripe_price_id_monthly=row.get('stripe_price_id_monthly'),
            stripe_price_id_yearly=row.get('stripe_price_id_yearly'),
            stripe_product_id=row.get('stripe_product_id'),
            features=features,
            transaction_fee_percentage=row.get('transaction_fee_percentage', Decimal('0.029')),
            max_invoices_per_month=row.get('max_invoices_per_month'),
            max_customers=row.get('max_customers'),
            max_seats=row.get('max_seats'),
            has_custom_branding=row.get('has_custom_branding', False),
            has_priority_support=row.get('has_priority_support', False),
            has_recurring_billing=row.get('has_recurring_billing', False),
            has_mobile_payments=row.get('has_mobile_payments', False),
            has_bulk_send=row.get('has_bulk_send', False),
            has_analytics=row.get('has_analytics', False),
            has_white_label=row.get('has_white_label', False),
            has_dedicated_support=row.get('has_dedicated_support', False),
            has_premium_api=row.get('has_premium_api', False),
            has_qr_codes=row.get('has_qr_codes', True),
            bulk_send_limit=row.get('bulk_send_limit'),
            is_active=row.get('is_active', True),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    def _row_to_user_subscription(self, row: Dict[str, Any]) -> UserSubscription:
        """Convert database row to UserSubscription model."""
        subscription = UserSubscription(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            plan_id=row.get('plan_id'),
            status=SubscriptionStatus(row['status']),
            trial_start_date=row.get('trial_start_date'),
            trial_end_date=row.get('trial_end_date'),
            current_period_start=row.get('current_period_start'),
            current_period_end=row.get('current_period_end'),
            stripe_subscription_id=row.get('stripe_subscription_id'),
            stripe_customer_id=row.get('stripe_customer_id'),
            card_last_four=row.get('card_last_four'),
            card_brand=row.get('card_brand'),
            canceled_at=row.get('canceled_at'),
            cancel_at_period_end=row.get('cancel_at_period_end', False),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
        
        # Attach plan if available in the row
        if 'plan_name' in row and row['plan_name']:
            features = row.get('features', [])
            if isinstance(features, str):
                import json
                features = json.loads(features)
            
            subscription.plan = SubscriptionPlan(
                id=row['plan_id'],
                name=row['plan_name'],
                slug=row['plan_slug'],
                price_monthly=row.get('price_monthly', Decimal('0')),
                features=features,
                has_custom_branding=row.get('has_custom_branding', False),
                has_priority_support=row.get('has_priority_support', False),
                has_recurring_billing=row.get('has_recurring_billing', False)
            )
        
        return subscription
    
    def _row_to_billing_history(self, row: Dict[str, Any]) -> BillingHistory:
        """Convert database row to BillingHistory model."""
        return BillingHistory(
            id=row['id'],
            user_id=row['user_id'],
            subscription_id=row['subscription_id'],
            amount=Decimal(str(row['amount'])),
            currency=Currency(row['currency']),
            status=BillingStatus(row['status']),
            stripe_invoice_id=row.get('stripe_invoice_id'),
            stripe_payment_intent_id=row.get('stripe_payment_intent_id'),
            billing_reason=BillingReason(row['billing_reason']) if row.get('billing_reason') else None,
            period_start=row.get('period_start'),
            period_end=row.get('period_end'),
            paid_at=row.get('paid_at'),
            created_at=row['created_at']
        )
    
    def _row_to_payout_account(self, row: Dict[str, Any]) -> PayoutAccount:
        """Convert database row to PayoutAccount object."""
        return PayoutAccount(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            stripe_account_id=row['stripe_account_id'],
            account_status=PayoutAccountStatus(row['account_status']),
            business_type=row.get('business_type'),
            country=row['country'],
            email=row.get('email'),
            requirements_currently_due=row.get('requirements_currently_due', []),
            requirements_past_due=row.get('requirements_past_due', []),
            charges_enabled=row['charges_enabled'],
            payouts_enabled=row['payouts_enabled'],
            details_submitted=row['details_submitted'],
            external_account_id=row.get('external_account_id'),
            capabilities=row.get('capabilities', {}),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    # Team Management Operations
    async def get_user_account(self) -> Optional[UserAccount]:
        """Get current user's account membership with role information."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT ua.*, a.name as account_name, a.slug as account_slug
            FROM user_accounts ua
            JOIN accounts a ON ua.account_id = a.id
            WHERE ua.user_id = $1 AND ua.account_id = $2
        """
        rows = await self._execute_query(query, self.user_id, account_id)
        if not rows:
            return None
        
        row = rows[0]
        user_account = UserAccount(
            id=row['id'],
            user_id=row['user_id'],
            account_id=row['account_id'],
            role=UserRole(row['role']),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
        user_account.account = Account(
            id=row['account_id'],
            name=row['account_name'],
            slug=row['account_slug']
        )
        return user_account
    
    async def get_team_members(self) -> List[UserAccount]:
        """Get all team members for the current account."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT ua.*, a.name as account_name, a.slug as account_slug
            FROM user_accounts ua
            JOIN accounts a ON ua.account_id = a.id
            WHERE ua.account_id = $1
            ORDER BY ua.created_at ASC
        """
        rows = await self._execute_query(query, account_id)
        members = []
        
        for row in rows:
            user_account = UserAccount(
                id=row['id'],
                user_id=row['user_id'],
                account_id=row['account_id'],
                role=UserRole(row['role']),
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            user_account.account = Account(
                id=row['account_id'],
                name=row['account_name'],
                slug=row['account_slug']
            )
            members.append(user_account)
        
        return members
    
    async def create_team_invitation(self, invitation: TeamInvitation) -> TeamInvitation:
        """Create a new team invitation."""
        account_id = await self._get_user_account_id()
        query = """
            INSERT INTO team_invitations 
            (id, account_id, invited_by_user_id, email, role, token, expires_at, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        """
        rows = await self._execute_query(
            query, invitation.id, account_id, invitation.invited_by_user_id,
            invitation.email, invitation.role.value, invitation.token,
            invitation.expires_at, invitation.created_at, invitation.updated_at
        )
        return self._row_to_team_invitation(rows[0])
    
    async def get_team_invitations(self, include_expired: bool = False) -> List[TeamInvitation]:
        """Get all team invitations for the current account."""
        account_id = await self._get_user_account_id()
        query = """
            SELECT * FROM team_invitations 
            WHERE account_id = $1 AND accepted_at IS NULL
        """
        
        if not include_expired:
            query += " AND expires_at > CURRENT_TIMESTAMP"
        
        query += " ORDER BY created_at DESC"
        
        rows = await self._execute_query(query, account_id)
        return [self._row_to_team_invitation(row) for row in rows]
    
    async def get_invitation_by_token(self, token: str) -> Optional[TeamInvitation]:
        """Get invitation by token for acceptance flow."""
        conn = await get_db_connection()
        try:
            query = "SELECT * FROM team_invitations WHERE token = $1 AND accepted_at IS NULL"
            rows = await conn.fetch(query, token)
            return self._row_to_team_invitation(rows[0]) if rows else None
        finally:
            await conn.close()
    
    async def get_account_details(self, account_id: UUID) -> Optional[dict]:
        """Get account details by account ID for invitation flow."""
        conn = await get_db_connection()
        try:
            query = "SELECT id, name, slug FROM accounts WHERE id = $1"
            rows = await conn.fetch(query, account_id)
            if rows:
                row = rows[0]
                return {
                    'id': row['id'],
                    'name': row['name'],
                    'slug': row['slug']
                }
            return None
        finally:
            await conn.close()
    
    async def accept_invitation(self, token: str, user_id: str) -> bool:
        """Accept a team invitation and create user account membership."""
        conn = await get_db_connection()
        try:
            async with conn.transaction():
                # Get invitation
                invitation_query = """
                    SELECT * FROM team_invitations 
                    WHERE token = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
                """
                invitation_rows = await conn.fetch(invitation_query, token)
                if not invitation_rows:
                    return False
                
                invitation_row = invitation_rows[0]
                
                # Check if user is already a member of this account
                existing_query = """
                    SELECT id FROM user_accounts 
                    WHERE user_id = $1 AND account_id = $2
                """
                existing_rows = await conn.fetch(existing_query, user_id, invitation_row['account_id'])
                if existing_rows:
                    return False
                
                # Create user account membership
                from uuid import uuid4
                user_account_query = """
                    INSERT INTO user_accounts (id, user_id, account_id, role, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
                await conn.execute(
                    user_account_query, uuid4(), user_id, 
                    invitation_row['account_id'], invitation_row['role']
                )
                
                # Mark invitation as accepted
                accept_query = """
                    UPDATE team_invitations 
                    SET accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE token = $1
                """
                await conn.execute(accept_query, token)
                
                return True
        finally:
            await conn.close()
    
    async def ensure_user_has_account_access(self, user_id: str, invitation_token: Optional[str] = None) -> UUID:
        """Ensure user has account access, either by creating new account (admin) or joining via invitation (member)."""
        # If there's an invitation token, this is a member signup flow
        if invitation_token:
            # Accept the invitation first
            invitation_accepted = await self.accept_invitation(invitation_token, user_id)
            if not invitation_accepted:
                raise ValueError("Invalid or expired invitation token")
            
            # Get the account ID from the accepted invitation
            invitation = await self.get_invitation_by_token(invitation_token)
            if invitation:
                return invitation.account_id
            else:
                # Fall back to getting account via user_accounts table
                repo = PaymentRepository(user_id)
                return await repo._get_user_account_id()
        else:
            # Admin signup flow - use existing self-healing logic
            repo = PaymentRepository(user_id)
            return await repo._get_user_account_id()
    
    async def remove_team_member(self, user_id: str) -> bool:
        """Remove a team member from the current account."""
        account_id = await self._get_user_account_id()
        
        # Don't allow removing self
        if user_id == self.user_id:
            return False
        
        query = "DELETE FROM user_accounts WHERE user_id = $1 AND account_id = $2"
        result = await self._execute_command(query, user_id, account_id)
        return "DELETE 1" in result
    
    async def update_member_role(self, user_id: str, new_role: UserRole) -> bool:
        """Update a team member's role."""
        account_id = await self._get_user_account_id()
        
        # Don't allow changing own role
        if user_id == self.user_id:
            return False
        
        query = """
            UPDATE user_accounts 
            SET role = $3, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND account_id = $2
        """
        result = await self._execute_command(query, user_id, account_id, new_role.value)
        return "UPDATE 1" in result
    
    async def revoke_invitation(self, invitation_id: UUID) -> bool:
        """Revoke a pending team invitation."""
        account_id = await self._get_user_account_id()
        query = """
            DELETE FROM team_invitations 
            WHERE id = $1 AND account_id = $2 AND accepted_at IS NULL
        """
        result = await self._execute_command(query, invitation_id, account_id)
        return "DELETE 1" in result
    
    async def get_user_role_in_account(self, user_id: str, account_id: UUID) -> Optional[UserRole]:
        """Get user's role in a specific account."""
        query = "SELECT role FROM user_accounts WHERE user_id = $1 AND account_id = $2"
        rows = await self._execute_query(query, user_id, account_id)
        return UserRole(rows[0]['role']) if rows else None
    
    def _row_to_team_invitation(self, row: Dict[str, Any]) -> TeamInvitation:
        """Convert database row to TeamInvitation model."""
        return TeamInvitation(
            id=row['id'],
            account_id=row['account_id'],
            invited_by_user_id=row['invited_by_user_id'],
            email=row['email'],
            role=UserRole(row['role']),
            token=row['token'],
            expires_at=row['expires_at'],
            accepted_at=row.get('accepted_at'),
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    # Usage Tracking Methods
    async def get_current_month_invoice_count(self) -> int:
        """Get the number of invoices created this month for the current account."""
        account_id = await self._get_user_account_id()
        
        query = """
            SELECT COUNT(*) as count
            FROM invoices 
            WHERE account_id = $1 
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
        """
        rows = await self._execute_query(query, account_id)
        return rows[0]['count'] if rows else 0
    
    async def get_usage_stats(self) -> Dict[str, Any]:
        """Get comprehensive usage statistics for the current account."""
        account_id = await self._get_user_account_id()
        
        # Get current month invoice count
        invoice_count = await self.get_current_month_invoice_count()
        
        # Get total customers count
        customer_query = "SELECT COUNT(*) as count FROM customers WHERE account_id = $1"
        customer_rows = await self._execute_query(customer_query, account_id)
        customer_count = customer_rows[0]['count'] if customer_rows else 0
        
        # Get team member count
        team_query = "SELECT COUNT(*) as count FROM user_accounts WHERE account_id = $1"
        team_rows = await self._execute_query(team_query, account_id)
        team_count = team_rows[0]['count'] if team_rows else 0
        
        return {
            'invoice_count_this_month': invoice_count,
            'total_customers': customer_count,
            'team_members': team_count
        }
    
    async def can_create_invoice(self) -> Dict[str, Any]:
        """Check if user can create a new invoice based on their plan limits."""
        # Get current subscription and plan
        subscription = await self.get_user_subscription()
        if not subscription or not subscription.plan:
            return {'can_create': False, 'reason': 'No active subscription'}
        
        plan = subscription.plan
        max_invoices = plan.max_invoices_per_month
        
        # If unlimited (None), user can always create
        if max_invoices is None:
            return {'can_create': True, 'usage': await self.get_current_month_invoice_count()}
        
        current_usage = await self.get_current_month_invoice_count()
        can_create = current_usage < max_invoices
        
        return {
            'can_create': can_create,
            'usage': current_usage,
            'limit': max_invoices,
            'remaining': max_invoices - current_usage if can_create else 0,
            'plan_name': plan.name
        }
