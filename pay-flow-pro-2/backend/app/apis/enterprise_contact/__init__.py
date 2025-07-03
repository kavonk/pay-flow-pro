from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import databutton as db
from datetime import datetime

router = APIRouter()

class EnterpriseContactRequest(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_size: Optional[str] = None  # "1-10", "11-50", "51-200", "200+"
    monthly_invoice_volume: Optional[str] = None  # "<100", "100-1000", "1000-5000", "5000+"
    current_solution: Optional[str] = None
    message: Optional[str] = None
    request_demo: bool = False
    preferred_contact_method: str = "email"  # "email", "phone", "either"

class EnterpriseContactResponse(BaseModel):
    success: bool
    message: str
    contact_id: str

@router.post("/enterprise-contact")
async def submit_enterprise_contact(request: EnterpriseContactRequest) -> EnterpriseContactResponse:
    """
    Handle Enterprise plan inquiries and demo requests.
    Store the inquiry and send notification to sales team.
    """
    try:
        # Generate a unique contact ID
        import uuid
        contact_id = str(uuid.uuid4())
        
        # Prepare the inquiry data
        inquiry_data = {
            "contact_id": contact_id,
            "company_name": request.company_name,
            "contact_name": request.contact_name,
            "email": request.email,
            "phone": request.phone,
            "company_size": request.company_size,
            "monthly_invoice_volume": request.monthly_invoice_volume,
            "current_solution": request.current_solution,
            "message": request.message,
            "request_demo": request.request_demo,
            "preferred_contact_method": request.preferred_contact_method,
            "created_at": datetime.utcnow().isoformat(),
            "status": "new"
        }
        
        # Store the inquiry in databutton storage
        storage_key = f"enterprise_inquiry_{contact_id}"
        db.storage.json.put(storage_key, inquiry_data)
        
        # Prepare email content for sales team notification
        email_subject = f"New Enterprise Inquiry from {request.company_name}"
        
        email_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
                    New Enterprise Plan Inquiry
                </h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e293b;">Contact Information</h3>
                    <p><strong>Company:</strong> {request.company_name}</p>
                    <p><strong>Contact:</strong> {request.contact_name}</p>
                    <p><strong>Email:</strong> {request.email}</p>
                    <p><strong>Phone:</strong> {request.phone or 'Not provided'}</p>
                    <p><strong>Preferred Contact:</strong> {request.preferred_contact_method.title()}</p>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e293b;">Company Details</h3>
                    <p><strong>Company Size:</strong> {request.company_size or 'Not specified'}</p>
                    <p><strong>Monthly Invoice Volume:</strong> {request.monthly_invoice_volume or 'Not specified'}</p>
                    <p><strong>Current Solution:</strong> {request.current_solution or 'Not specified'}</p>
                    <p><strong>Demo Requested:</strong> {'Yes' if request.request_demo else 'No'}</p>
                </div>
                
                {f'<div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="margin-top: 0; color: #1e293b;">Message</h3><p>{request.message}</p></div>' if request.message else ''}
                
                <div style="background: #7c3aed; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0;">Next Steps</h4>
                    <p style="margin: 5px 0 0 0;">Contact ID: {contact_id}</p>
                    <p style="margin: 5px 0 0 0;">Response SLA: Within 4 business hours</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        email_text = f"""
        New Enterprise Plan Inquiry
        
        Contact Information:
        Company: {request.company_name}
        Contact: {request.contact_name}
        Email: {request.email}
        Phone: {request.phone or 'Not provided'}
        Preferred Contact: {request.preferred_contact_method.title()}
        
        Company Details:
        Company Size: {request.company_size or 'Not specified'}
        Monthly Invoice Volume: {request.monthly_invoice_volume or 'Not specified'}
        Current Solution: {request.current_solution or 'Not specified'}
        Demo Requested: {'Yes' if request.request_demo else 'No'}
        
        {'Message: ' + request.message if request.message else ''}
        
        Contact ID: {contact_id}
        Response SLA: Within 4 business hours
        """
        
        # Send notification email to sales team
        # Note: Replace with actual sales team email
        sales_email = "sales@payflowpro.com"  # This should be configured in secrets
        
        try:
            db.notify.email(
                to=sales_email,
                subject=email_subject,
                content_html=email_html,
                content_text=email_text
            )
        except Exception as email_error:
            print(f"Failed to send sales notification email: {email_error}")
            # Continue execution - don't fail the request due to email issues
        
        # Send confirmation email to the inquirer
        confirmation_subject = f"Thank you for your Enterprise inquiry - PayFlow Pro"
        
        # Build demo line conditionally
        demo_line_html = "<li>We'll schedule a personalized demo as requested</li>" if request.request_demo else ""
        demo_line_text = "- We'll schedule a personalized demo as requested" if request.request_demo else ""
        
        confirmation_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
                    Thank You for Your Interest in PayFlow Pro Enterprise
                </h2>
                
                <p>Dear {request.contact_name},</p>
                
                <p>Thank you for your interest in PayFlow Pro Enterprise. We've received your inquiry and our sales team will contact you within 4 business hours.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e293b;">What happens next?</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Our Enterprise specialist will review your requirements</li>
                        <li>We'll prepare a customized proposal for {request.company_name}</li>
                        {demo_line_html}
                        <li>You'll receive pricing based on your specific needs</li>
                    </ul>
                </div>
                
                <div style="background: #7c3aed; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0;">Your Inquiry Details</h4>
                    <p style="margin: 5px 0;">Reference ID: {contact_id}</p>
                    <p style="margin: 5px 0;">Company: {request.company_name}</p>
                    <p style="margin: 5px 0;">Contact Method: {request.preferred_contact_method.title()}</p>
                </div>
                
                <p>In the meantime, feel free to explore our Enterprise features or reach out directly at enterprise@payflowpro.com</p>
                
                <p>Best regards,<br>
                The PayFlow Pro Sales Team</p>
            </div>
        </body>
        </html>
        """
        
        confirmation_text = f"""
        Thank You for Your Interest in PayFlow Pro Enterprise
        
        Dear {request.contact_name},
        
        Thank you for your interest in PayFlow Pro Enterprise. We've received your inquiry and our sales team will contact you within 4 business hours.
        
        What happens next?
        - Our Enterprise specialist will review your requirements
        - We'll prepare a customized proposal for {request.company_name}
        {demo_line_text}
        - You'll receive pricing based on your specific needs
        
        Your Inquiry Details:
        Reference ID: {contact_id}
        Company: {request.company_name}
        Contact Method: {request.preferred_contact_method.title()}
        
        In the meantime, feel free to explore our Enterprise features or reach out directly at enterprise@payflowpro.com
        
        Best regards,
        The PayFlow Pro Sales Team
        """
        
        try:
            db.notify.email(
                to=request.email,
                subject=confirmation_subject,
                content_html=confirmation_html,
                content_text=confirmation_text
            )
        except Exception as email_error:
            print(f"Failed to send confirmation email: {email_error}")
            # Continue execution - don't fail the request due to email issues
        
        return EnterpriseContactResponse(
            success=True,
            message="Thank you for your inquiry! Our sales team will contact you within 4 business hours.",
            contact_id=contact_id
        )
        
    except Exception as e:
        print(f"Error processing enterprise contact: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process your inquiry. Please try again or contact us directly."
        )

@router.get("/enterprise-inquiries")
async def get_enterprise_inquiries():
    """
    Get all enterprise inquiries (for admin/sales team use)
    """
    try:
        inquiries = []
        # List all inquiry files
        files = db.storage.list()
        
        for file_path in files:
            if file_path.startswith('enterprise_inquiry_'):
                inquiry_data = db.storage.json.get(file_path)
                inquiries.append(inquiry_data)
        
        # Sort by created_at descending
        inquiries.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {"inquiries": inquiries}
        
    except Exception as e:
        print(f"Error fetching enterprise inquiries: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch inquiries"
        )
