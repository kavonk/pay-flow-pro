from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
import databutton as db
import stripe
from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
import os

router = APIRouter()

class CustomerPortalResponse(BaseModel):
    url: str

@router.post("/subscription/customer-portal", response_model=CustomerPortalResponse)
async def create_customer_portal(
    user: AuthorizedUser,
):
    """
    Creates a Stripe customer portal session for the user to manage their subscription.
    """
    repo = PaymentRepository(user_id=user.sub)
    try:
        # 1. Get the user's current subscription
        subscription = await repo.get_user_subscription()
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found for this user.")

        stripe_customer_id = subscription.stripe_customer_id
        
        # 2. If the user doesn't have a Stripe customer ID, create one
        if not stripe_customer_id:
            try:
                print(f"No Stripe customer ID found for user {user.sub}. Creating a new one.")
                new_stripe_customer = stripe.Customer.create(
                    email=user.email,
                    name=user.name,
                    metadata={
                        "user_id": user.sub,
                        "account_id": str(subscription.account_id)
                    }
                )
                stripe_customer_id = new_stripe_customer.id
                print(f"Successfully created Stripe customer {stripe_customer_id} for user {user.sub}")
                
                # 3. Update the local subscription record with the new ID
                await repo.update_stripe_customer_id(subscription.id, stripe_customer_id)
                print(f"Successfully updated subscription {subscription.id} with new Stripe customer ID.")

            except Exception as e:
                print(f"ERROR: Failed to create Stripe customer for user {user.sub}. Reason: {e}")
                raise HTTPException(status_code=500, detail="Failed to create customer record in Stripe.")

        # 4. Create the customer portal session
        try:
            # Get the base URL from environment variables for constructing the return URL
            # This should be the URL of your frontend application
            return_url = db.secrets.get("FRONTEND_URL", "http://localhost:5173/settings/billing") # Fallback for local dev

            portal_session = stripe.billing_portal.Session.create(
                customer=stripe_customer_id,
                return_url=return_url,
            )
            return CustomerPortalResponse(url=portal_session.url)
        except Exception as e:
            print(f"ERROR: Failed to create Stripe billing portal session for customer {stripe_customer_id}. Reason: {e}")
            # This is where a 400 "Invalid request" can happen if the customer ID is invalid
            raise HTTPException(status_code=500, detail="Could not create billing portal session.")
            
    except HTTPException as http_exc:
        # Re-raise HTTPException to ensure FastAPI handles it correctly
        raise http_exc
    except Exception as e:
        print(f"ERROR: An unexpected error occurred while creating customer portal for user {user.sub}. Reason: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

class FeatureAccessResponse(BaseModel):
    has_access: bool
    
class Subscription(BaseModel):
    user_id: str
    plan_id: str
    status: str
    trial_ends_at: str = None


@router.get("/subscription/feature-access", response_model=FeatureAccessResponse)
async def get_subscription_feature_access(
    feature_key: str,
    user: AuthorizedUser,
):
    """
    Checks if the current user has access to a specific feature based on their subscription.
    """
    conn = None
    try:
        # Use a connection pool for better performance
        conn = await db.connections.get_async("datastore")
        
        # Get the user's current subscription plan details in a single query
        plan = await conn.fetchrow(
            """
            SELECT p.*
            FROM user_subscriptions us
            JOIN subscription_plans p ON us.plan_id = p.id
            WHERE us.user_id = $1 AND us.is_active = true
            """,
            user.sub
        )

        if not plan:
            # If no active subscription, check if they are in a trial period
            # For now, default to no access if no active subscription
            return FeatureAccessResponse(has_access=False)

        plan_features = plan.get("features", {})

        # --- Centralized Access Logic ---

        # 1. Direct feature flag check (default case)
        has_access = plan_features.get(feature_key, False)

        # 2. Limit-based feature checks
        if feature_key == "dunning_rules":
            # Check if the plan allows creating dunning rules at all
            if not has_access:
                 return FeatureAccessResponse(has_access=False)
            
            # Now, check the usage against the limit
            limit = plan.get("dunning_rules_limit")
            if limit is not None and limit != -1:  # -1 represents "Unlimited"
                current_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM dunning_rules WHERE user_id = $1",
                    user.sub
                )
                # Access is granted if the user is still under the limit
                has_access = current_count < limit
            else:
                # The plan has no limit on this feature
                has_access = True
        
        # Add other limit-based checks here in the future (e.g., invoice_limit)
        # elif feature_key == "invoices":
        #    ...

        return FeatureAccessResponse(has_access=bool(has_access))

    except Exception as e:
        # In production, you'd want more robust logging (e.g., Sentry)
        print(f"ERROR: Could not verify feature access for user {user.sub} and feature {feature_key}. Reason: {e}")
        # Fail securely by denying access
        raise HTTPException(status_code=500, detail="Could not verify feature access.")
    finally:
        # The connection from the pool is automatically released
        pass
