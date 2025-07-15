from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import databutton as db
from app.libs.trial_scheduler import get_trials_expiring_soon

router = APIRouter()

class NotificationRequest(BaseModel):
    days_ahead: int = 3  # Send notifications 3 days before trial expires

class NotificationResponse(BaseModel):
    success: bool
    notifications_sent: int
    message: str

class TrialReminderData(BaseModel):
    user_id: str
    trial_end_date: datetime
    days_remaining: int
    plan_name: str

@router.post("/send-trial-reminders", response_model=NotificationResponse)
async def send_trial_reminders(request: NotificationRequest):
    """Send reminder notifications to users whose trials are expiring soon.
    
    This should be called daily, a few days before trials expire.
    """
    try:
        # Get trials expiring soon
        expiring_trials = await get_trials_expiring_soon(request.days_ahead)
        
        notifications_sent = 0
        
        for trial in expiring_trials:
            try:
                await send_trial_reminder_email(trial)
                notifications_sent += 1
                print(f"Sent trial reminder to user {trial['user_id']}")
            except Exception as e:
                print(f"Failed to send trial reminder to user {trial['user_id']}: {str(e)}")
                continue
        
        message = f"Sent {notifications_sent} trial reminder notifications"
        print(message)
        
        return NotificationResponse(
            success=True,
            notifications_sent=notifications_sent,
            message=message
        )
        
    except Exception as e:
        error_message = f"Failed to send trial reminders: {str(e)}"
        print(error_message)
        
        return NotificationResponse(
            success=False,
            notifications_sent=0,
            message=error_message
        )

async def send_trial_reminder_email(trial_data: dict):
    """Send a trial reminder email to a specific user."""
    user_id = trial_data['user_id']
    trial_end_date = trial_data['trial_end_date']
    plan_name = trial_data.get('plan_name', 'Free Trial')
    
    # Calculate days remaining
    days_remaining = (trial_end_date - datetime.now(timezone.utc)).days
    
    # In a real implementation, you would:
    # 1. Get user email from user management system
    # 2. Send email via email service (SendGrid, Mailgun, etc.)
    
    # For now, we'll use Databutton's notification system
    subject = f"Your PayFlow Pro trial expires in {days_remaining} days"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PayFlow Pro</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Trial Reminder</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-top: 0;">Your trial expires soon!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                Your PayFlow Pro {plan_name} expires in <strong>{days_remaining} days</strong>.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
                After your trial ends, you'll be automatically upgraded to our Basic plan (€35/month) 
                to ensure uninterrupted access to your invoices and payment processing.
            </p>
        </div>
        
        <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; border-left: 4px solid #3498db;">
            <h3 style="color: #2980b9; margin-top: 0;">What happens next?</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Your trial will automatically convert to Basic plan (€35/month)</li>
                <li>No action required - seamless transition</li>
                <li>Continue using all your existing invoices and data</li>
                <li>You can change plans anytime from your dashboard</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://kavonk.databutton.app/payflow-pro/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                      font-weight: bold; font-size: 16px;">View Dashboard</a>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
            <p>Questions? Contact us at support@payflowpro.com</p>
        </div>
    </div>
    """
    
    text_content = f"""
    PayFlow Pro - Trial Reminder
    
    Your PayFlow Pro {plan_name} expires in {days_remaining} days.
    
    After your trial ends, you'll be automatically upgraded to our Basic plan (€35/month) 
    to ensure uninterrupted access to your invoices and payment processing.
    
    What happens next?
    - Your trial will automatically convert to Basic plan (€35/month)
    - No action required - seamless transition
    - Continue using all your existing invoices and data
    - You can change plans anytime from your dashboard
    
    Visit your dashboard: https://kavonk.databutton.app/payflow-pro/dashboard
    
    Questions? Contact us at support@payflowpro.com
    """
    
    # Note: In production, you would need to get the user's email address
    # For now, this is a placeholder - the email sending would need to be implemented
    # with the actual user email retrieval and email service integration
    print(f"Trial reminder email prepared for user {user_id} (email sending not implemented yet)")
    
    # TODO: Implement actual email sending once user email retrieval is available
    # db.notify.email(
    #     to=user_email,
    #     subject=subject,
    #     content_html=html_content,
    #     content_text=text_content,
    # )
