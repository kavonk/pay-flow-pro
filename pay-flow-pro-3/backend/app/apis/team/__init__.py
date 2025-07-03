from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta
import databutton as db

from app.auth import AuthorizedUser
from app.libs.repository import PaymentRepository
from app.libs.models import TeamInvitation, UserRole, UserAccount
from app.libs.audit_logging import audit_logger, AuditAction, ResourceType

router = APIRouter()

# Email invitation helper function
async def send_invitation_email(invitation: TeamInvitation):
    """Send invitation email to the invited user."""
    try:
        # Create invitation URL - environment-aware
        from app.env import mode, Mode
        
        if mode == Mode.PROD:
            base_url = "https://kavonk.databutton.app/payflow-pro"
        else:
            # Development environment
            base_url = "https://databutton.com/_projects/f263b849-f255-4941-b718-64221e5922dc/dbtn/devx/ui"
        
        # Use signup URL with invitation token as query parameter - redirect to join team page after auth
        signup_url = f"{base_url}/auth/sign-up?redirectUrl={base_url}/join-team?token={invitation.token}"
        signin_url = f"{base_url}/auth/sign-in?redirectUrl={base_url}/join-team?token={invitation.token}"
        
        # Also provide direct link to public join team page
        join_url = f"{base_url}/join-team?token={invitation.token}"
        
        subject = "You've been invited to join PayFlow Pro"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">PayFlow Pro</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Team Invitation</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0;">You're Invited!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    You've been invited to join a PayFlow Pro team as a <strong>{invitation.role.value.title()}</strong>.
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Your invitation email: <strong>{invitation.email}</strong>
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    PayFlow Pro is a comprehensive payments platform that helps teams manage customers, 
                    create invoices, process payments, and automate collections.
                </p>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">How to Accept Your Invitation:</h3>
                    <div style="margin-bottom: 20px; text-align: center;">
                        <a href="{join_url}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold; 
                                  font-size: 16px; 
                                  display: inline-block; 
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            Accept Invitation & Join Team
                        </a>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #333;">Alternative Options:</strong>
                        <p style="color: #555; margin: 5px 0 0 0;">If the button above doesn't work, you can:</p>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #333; font-size: 14px;">New User?</strong>
                        <p style="color: #555; margin: 2px 0; font-size: 14px;">Create account first:</p>
                        <div style="margin: 5px 0;">
                            <a href="{signup_url}" 
                               style="background: #f8f9fa; 
                                      color: #667eea; 
                                      border: 1px solid #667eea;
                                      padding: 8px 15px; 
                                      text-decoration: none; 
                                      border-radius: 4px; 
                                      font-size: 13px; 
                                      display: inline-block;">
                                Create Account
                            </a>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <strong style="color: #333; font-size: 14px;">Existing User?</strong>
                        <p style="color: #555; margin: 2px 0; font-size: 14px;">Sign in first:</p>
                        <div style="margin: 5px 0;">
                            <a href="{signin_url}" 
                               style="background: #f8f9fa; 
                                      color: #667eea; 
                                      border: 1px solid #667eea;
                                      padding: 8px 15px; 
                                      text-decoration: none; 
                                      border-radius: 4px; 
                                      font-size: 13px; 
                                      display: inline-block;">
                                Sign In
                            </a>
                        </div>
                    </div>
                </div>
                
                <p style="color: #777; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
                    This invitation expires in 7 days. Links above will guide you through the proper signup/signin flow.
                </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
                <p>This invitation was sent from PayFlow Pro. If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
        </div>
        """
        
        text_content = f"""
        You've been invited to join PayFlow Pro!
        
        You've been invited to join a PayFlow Pro team as a {invitation.role.value.title()}.
        Your invitation email: {invitation.email}
        
        PayFlow Pro is a comprehensive payments platform that helps teams manage customers, create invoices, process payments, and automate collections.
        
        How to Accept Your Invitation:
        
        Accept your invitation:
        {join_url}
        
        Alternative options:
        - New user? Create account first: {signup_url}
        - Existing user? Sign in first: {signin_url}
        
        This invitation expires in 7 days.
        
        If you weren't expecting this invitation, you can safely ignore this email.
        """
        
        # Send email using Databutton SDK
        db.notify.email(
            to=invitation.email,
            subject=subject,
            content_html=html_content,
            content_text=text_content
        )
        
        print(f"Invitation email sent successfully to {invitation.email}")
        
    except Exception as e:
        print(f"Failed to send invitation email to {invitation.email}: {str(e)}")
        # Don't raise the exception to avoid breaking the invitation creation
        # The invitation is still created even if email fails

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = "member"  # "admin" or "member"

class InviteUserResponse(BaseModel):
    id: str
    email: str
    role: str
    token: str
    expires_at: datetime
    created_at: datetime

class TeamMemberResponse(BaseModel):
    user_id: str
    role: str
    created_at: datetime
    # Note: We'll need to get user details from Stack Auth later

class TeamInvitationResponse(BaseModel):
    id: str
    email: str
    role: str
    expires_at: datetime
    created_at: datetime
    is_expired: bool

class UpdateMemberRoleRequest(BaseModel):
    role: str  # "admin" or "member"

class AcceptInvitationRequest(BaseModel):
    token: str

class AcceptInvitationPublicRequest(BaseModel):
    token: str
    email: str
    password: str
    
class InvitationDetailsResponse(BaseModel):
    id: str
    email: str
    role: str
    expires_at: datetime
    is_expired: bool
    account_name: str  # Company/organization name

# Team Management Endpoints
@router.get("/members", response_model=List[TeamMemberResponse])
async def get_team_members(user: AuthorizedUser):
    """Get all team members for the current account."""
    try:
        repo = PaymentRepository(user.sub)
        members = await repo.get_team_members()
        
        return [
            TeamMemberResponse(
                user_id=member.user_id,
                role=member.role.value,
                created_at=member.created_at
            )
            for member in members
        ]
    except Exception as e:
        print(f"Error fetching team members: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch team members")

@router.get("/invitations", response_model=List[TeamInvitationResponse])
async def get_team_invitations(user: AuthorizedUser):
    """Get all pending team invitations for the current account."""
    try:
        # Check if user is admin
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        if not user_account or not user_account.can_manage_users:
            raise HTTPException(status_code=403, detail="Only admins can view invitations")
        
        invitations = await repo.get_team_invitations()
        
        return [
            TeamInvitationResponse(
                id=str(invitation.id),
                email=invitation.email,
                role=invitation.role.value,
                expires_at=invitation.expires_at,
                created_at=invitation.created_at,
                is_expired=invitation.is_expired
            )
            for invitation in invitations
        ]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching team invitations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch team invitations")

@router.post("/invite", response_model=InviteUserResponse)
async def invite_user(request: InviteUserRequest, user: AuthorizedUser):
    """Invite a user to join the team."""
    try:
        # Check if user is admin
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        if not user_account or not user_account.can_manage_users:
            raise HTTPException(status_code=403, detail="Only admins can invite users")
        
        # Validate role
        if request.role not in ["admin", "member"]:
            raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")
        
        # Check if email is already a team member
        members = await repo.get_team_members()
        if any(member.email and member.email.lower() == request.email.lower() for member in members if hasattr(member, 'email')):
            raise HTTPException(status_code=400, detail="User is already a team member")
        
        # Check for existing active (non-expired) invitations
        existing_invitations = await repo.get_team_invitations()
        active_invitation = next(
            (inv for inv in existing_invitations 
             if inv.email.lower() == request.email.lower() and not inv.is_expired), 
            None
        )
        if active_invitation:
            raise HTTPException(status_code=400, detail="Active invitation already exists for this email")
        
        # Clean up any expired invitations for this email
        expired_invitations = [
            inv for inv in existing_invitations 
            if inv.email.lower() == request.email.lower() and inv.is_expired
        ]
        for expired_inv in expired_invitations:
            await repo.revoke_invitation(expired_inv.id)
        
        # Create invitation
        invitation = TeamInvitation(
            id=uuid4(),
            account_id=user_account.account_id,
            invited_by_user_id=user.sub,
            email=request.email.lower(),
            role=UserRole.ADMIN if request.role == "admin" else UserRole.MEMBER,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        created_invitation = await repo.create_team_invitation(invitation)
        
        # Send invitation email in background - don't block the response
        import asyncio
        asyncio.create_task(send_invitation_email(created_invitation))
        
        # Log audit trail
        await audit_logger.log_action(
            user_id=user.sub,
            action=AuditAction.INVITE_USER,
            resource_type=ResourceType.USER,
            resource_id=created_invitation.email,
            changes={
                "email": created_invitation.email,
                "role": created_invitation.role.value,
                "invited_by": user.sub
            }
        )
        
        return InviteUserResponse(
            id=str(created_invitation.id),
            email=created_invitation.email,
            role=created_invitation.role.value,
            token=created_invitation.token,
            expires_at=created_invitation.expires_at,
            created_at=created_invitation.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inviting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to invite user")

@router.post("/accept-invitation")
async def accept_invitation(request: AcceptInvitationRequest, user: AuthorizedUser):
    """Accept a team invitation."""
    try:
        repo = PaymentRepository(user.sub)
        
        # Get invitation details first
        invitation = await repo.get_invitation_by_token(request.token)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        if invitation.is_expired:
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Accept the invitation
        success = await repo.accept_invitation(request.token, user.sub)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to accept invitation. You may already be a member.")
        
        # Log audit trail
        await audit_logger.log_action(
            user_id=user.sub,
            action=AuditAction.ACCEPT_INVITATION,
            resource_type=ResourceType.USER,
            resource_id=user.sub,
            changes={
                "account_id": str(invitation.account_id),
                "role": invitation.role.value,
                "email": invitation.email
            }
        )
        
        return {"message": "Successfully joined the team", "account_id": str(invitation.account_id)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

@router.put("/members/{user_id}/role")
async def update_member_role(user_id: str, request: UpdateMemberRoleRequest, user: AuthorizedUser):
    """Update a team member's role."""
    try:
        # Check if user is admin
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        if not user_account or not user_account.can_manage_users:
            raise HTTPException(status_code=403, detail="Only admins can update member roles")
        
        # Validate role
        if request.role not in ["admin", "member"]:
            raise HTTPException(status_code=400, detail="Role must be 'admin' or 'member'")
        
        # Don't allow changing own role
        if user_id == user.sub:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        
        new_role = UserRole.ADMIN if request.role == "admin" else UserRole.MEMBER
        success = await repo.update_member_role(user_id, new_role)
        
        if not success:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        return {"message": "Member role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating member role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update member role")

@router.delete("/members/{user_id}")
async def remove_team_member(user_id: str, user: AuthorizedUser):
    """Remove a team member from the account."""
    try:
        # Check if user is admin
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        if not user_account or not user_account.can_manage_users:
            raise HTTPException(status_code=403, detail="Only admins can remove team members")
        
        # Don't allow removing self
        if user_id == user.sub:
            raise HTTPException(status_code=400, detail="Cannot remove yourself from the team")
        
        success = await repo.remove_team_member(user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Team member not found")
        
        return {"message": "Team member removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing team member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove team member")

@router.delete("/invitations/{invitation_id}")
async def revoke_invitation(invitation_id: str, user: AuthorizedUser):
    """Revoke a pending team invitation."""
    try:
        # Check if user is admin
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        if not user_account or not user_account.can_manage_users:
            raise HTTPException(status_code=403, detail="Only admins can revoke invitations")
        
        success = await repo.revoke_invitation(UUID(invitation_id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        return {"message": "Invitation revoked successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid invitation ID")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to revoke invitation")

# Public invitation endpoints (no authentication required)
@router.get("/invitation/{token}")
async def get_invitation_details2(token: str):
    """Get invitation details without authentication for display on acceptance page."""
    try:
        # Create a temporary repo instance - we'll need to modify this to not require user_id
        # For now, use a placeholder and modify repo method to handle invitation-only queries
        repo = PaymentRepository("system")  # Placeholder user_id
        
        invitation = await repo.get_invitation_by_token(token)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        # Get account details for display
        account_details = await repo.get_account_details(invitation.account_id)
        
        return InvitationDetailsResponse(
            id=str(invitation.id),
            email=invitation.email,
            role=invitation.role.value,
            expires_at=invitation.expires_at,
            is_expired=invitation.is_expired,
            account_name=account_details.get('name', 'Team') if account_details else 'Team'
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting invitation details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get invitation details")

@router.post("/accept-invitation-public")
async def accept_invitation_public2(request: AcceptInvitationPublicRequest):
    """Accept invitation and create new account if needed (no auth required)."""
    try:
        # Create a temporary repo instance
        repo = PaymentRepository("system")
        
        # Get invitation details first
        invitation = await repo.get_invitation_by_token(request.token)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        if invitation.is_expired:
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Verify email matches invitation
        if invitation.email.lower() != request.email.lower():
            raise HTTPException(status_code=400, detail="Email does not match invitation")
        
        # TODO: Integrate with Stack Auth to create user account
        # For now, we'll create a placeholder user_id and handle account creation
        
        # This is where we would:
        # 1. Create Stack Auth user with email/password
        # 2. Get the new user ID from Stack Auth
        # 3. Accept the invitation with the new user ID
        
        # Placeholder implementation - in real implementation, we'd get user_id from Stack Auth
        import uuid
        new_user_id = str(uuid.uuid4())  # This should come from Stack Auth
        
        # Accept the invitation
        success = await repo.accept_invitation(request.token, new_user_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to accept invitation")
        
        return {
            "message": "Successfully joined the team", 
            "account_id": str(invitation.account_id),
            "user_id": new_user_id,
            "email": request.email
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to accept invitation")

@router.get("/my-role")
async def get_my_role(user: AuthorizedUser):
    """Get current user's role in the team."""
    try:
        repo = PaymentRepository(user.sub)
        user_account = await repo.get_user_account()
        
        if not user_account:
            raise HTTPException(status_code=404, detail="User not found in any account")
        
        return {
            "user_id": user.sub,
            "role": user_account.role.value,
            "can_manage_users": user_account.can_manage_users,
            "can_manage_billing": user_account.can_manage_billing,
            "account_id": str(user_account.account_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user role: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user role")
