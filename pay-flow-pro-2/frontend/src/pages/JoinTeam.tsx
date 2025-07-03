import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { stackClientApp } from 'app/auth';
import { useUser } from '@stackframe/react';
import { useInvitationDetails, type InvitationDetails } from 'utils/queryHooks';

const JoinTeam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useUser();
  const token = searchParams.get('token');
  
  const { data: invitation, isLoading: loading, error: invitationError } = useInvitationDetails(token);
  const [accepting, setAccepting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'loading' | 'form' | 'existing-user' | 'success'>('loading');

  // Handle invitation loading and user state
  useEffect(() => {
    if (!token) {
      return;
    }

    if (invitation) {
      // Check if user is already signed in
      if (user) {
        setStep('existing-user');
      } else {
        setStep('form');
      }
    } else if (invitationError) {
      setStep('loading'); // Show error in the loading state
    }
  }, [token, invitation, user, invitationError]);

  const handleAcceptInvitationExistingUser = async () => {
    if (!user || !token) return;
    
    setAccepting(true);
    
    try {
      const response = await brain.accept_invitation({ token });
      
      if (response.ok) {
        setStep('success');
        toast.success('Successfully joined the team!');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to accept invitation');
        setError(errorData.detail || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error('Failed to accept invitation');
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleCreateAccountAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation || !token) return;
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setAccepting(true);
    
    try {
      // First, try to create the user account with Stack Auth
      const signUpResult = await stackClientApp.signUp({
        email: invitation.email,
        password: password,
      });
      
      if (!signUpResult.user) {
        throw new Error('Failed to create account');
      }
      
      // Now accept the invitation - since user is signed in, use regular endpoint
      const response = await brain.accept_invitation({ token });
      
      if (response.ok) {
        setStep('success');
        toast.success('Successfully joined the team!');
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      
      if (err.message?.includes('already exists') || err.message?.includes('SIGN_UP_EMAIL_ALREADY_EXISTS')) {
        // User already exists, try to sign them in and accept invitation
        try {
          const signInResult = await stackClientApp.signIn({
            email: invitation.email,
            password: password,
          });
          
          if (signInResult.user) {
            // User signed in successfully, now accept invitation
            const response = await brain.accept_invitation({ token });
            if (response.ok) {
              setStep('success');
              toast.success('Successfully joined the team!');
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
              return;
            }
          }
        } catch (signInErr) {
          toast.error('Account exists but password is incorrect');
        }
      } else {
        toast.error(err.message || 'Failed to accept invitation');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading || (!invitation && !invitationError)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationError || !token) {
    const errorMessage = !token 
      ? 'No invitation token provided' 
      : invitationError instanceof Error 
        ? invitationError.message 
        : 'Invalid or expired invitation';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitation?.account_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Redirecting you to the dashboard...
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'existing-user' && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Join PayFlow Pro</CardTitle>
            <CardDescription>
              You've been invited to join {invitation?.account_name}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {invitation?.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Users className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{invitation?.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Role: {invitation?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Signed in as <strong>{user.displayName || user.primaryEmail}</strong>
              </p>
            </div>
            
            <Button 
              onClick={handleAcceptInvitationExistingUser}
              disabled={accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining Team...
                </>
              ) : (
                'Accept Invitation & Join Team'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Join PayFlow Pro</CardTitle>
          <CardDescription>
            You've been invited to join {invitation?.account_name}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {invitation?.is_expired ? (
            <Alert variant="destructive">
              <AlertDescription>
                This invitation has expired. Please contact your team administrator for a new invitation.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {invitation?.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{invitation?.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Role: {invitation?.role}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expires: {invitation?.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              
              <form onSubmit={handleCreateAccountAndAccept} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={accepting || !password || !confirmPassword}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Join Team'
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                By accepting this invitation, you agree to create an account with PayFlow Pro.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinTeam;