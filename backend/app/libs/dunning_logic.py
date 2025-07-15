
import asyncio
import databutton as db
import asyncpg
from datetime import datetime, timezone
from app.env import mode, Mode

async def send_reminder(customer_email, message):
    """
    Sends a reminder email to a customer.
    """
    try:
        # Assuming db.notify.email is an async function
        await db.notify.email(
            to=customer_email,
            subject="Invoice Reminder",
            content_text=message
        )
        print(f"Successfully sent reminder to {customer_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {customer_email}: {e}")
        return False

async def process_dunning_for_all_tenants():
    """
    Processes dunning for all tenants by checking for overdue invoices
    and sending reminders based on dunning rules.
    """
    print("Starting dunning process...")
    conn = None
    try:
        # Get the database URL from secrets
        database_url = db.secrets.get("DATABASE_URL_DEV" if mode == Mode.DEV else "DATABASE_URL_PROD")
        if not database_url:
            print("Database URL not found in secrets.")
            return

        conn = await asyncpg.connect(database_url)
        print("Database connection established.")

        # Get current time in UTC
        now = datetime.now(timezone.utc)

        # 1. Fetch all active dunning rules
        rules = await conn.fetch("SELECT id, offset_days, message, channel FROM dunning_rules")
        if not rules:
            print("No dunning rules found. Exiting.")
            return

        # 2. Fetch all overdue invoices with their customer's email
        # An invoice is overdue if its due_date has passed and status is not 'PAID' or 'CANCELLED'
        overdue_invoices = await conn.fetch("""
            SELECT 
                i.id as invoice_id, 
                i.due_date, 
                c.email as customer_email
            FROM 
                invoices i
            JOIN 
                customers c ON i.customer_id = c.id
            WHERE 
                i.status NOT IN ('PAID', 'CANCELLED') AND i.due_date < $1
        """, now)

        if not overdue_invoices:
            print("No overdue invoices found. Exiting.")
            return
        
        print(f"Found {len(overdue_invoices)} overdue invoices to process.")

        # 3. Process each overdue invoice
        for invoice in overdue_invoices:
            days_overdue = (now.date() - invoice['due_date']).days
            
            for rule in rules:
                # Check if the rule's offset matches the days overdue
                if rule['offset_days'] == days_overdue:
                    # Check if a reminder for this invoice and rule has already been sent
                    history_exists = await conn.fetchval("""
                        SELECT 1 FROM dunning_history 
                        WHERE invoice_id = $1 AND dunning_rule_id = $2
                    """, invoice['invoice_id'], rule['id'])
                    
                    if not history_exists:
                        print(f"Rule match: Invoice {invoice['invoice_id']} is {days_overdue} days overdue. Sending reminder.")
                        
                        # 4. Send reminder
                        if rule['channel'] == 'EMAIL':
                            success = await send_reminder(invoice['customer_email'], rule['message'])
                            if success:
                                # 5. Log sent reminder in dunning_history
                                await conn.execute("""
                                    INSERT INTO dunning_history (invoice_id, dunning_rule_id, sent_at)
                                    VALUES ($1, $2, $3)
                                """, invoice['invoice_id'], rule['id'], now)
                                print(f"Logged reminder for invoice {invoice['invoice_id']} and rule {rule['id']}.")
                    else:
                        print(f"Skipping: Reminder for invoice {invoice['invoice_id']} and rule {rule['id']} already sent.")

    except Exception as e:
        print(f"An error occurred during the dunning process: {e}")
    finally:
        if conn:
            await conn.close()
            print("Database connection closed.")
    
    print("Dunning process finished.")

# Example of how to run this function
if __name__ == "__main__":
    asyncio.run(process_dunning_for_all_tenants())
