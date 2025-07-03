import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const OnboardingComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const refresh = searchParams.get('refresh') === 'true';
  const userId = searchParams.get('user_id');

  useEffect(() => {
    // If this is opened in a popup, try to communicate with parent
    if (window.opener && !window.opener.closed) {
      try {
        // Send message to parent window
        window.opener.postMessage({
          type: 'stripe-onboarding-complete',
          success: success,
          refresh: refresh,
          userId: userId
        }, window.location.origin);
        
        // Close popup after message is sent
        setTimeout(() => {
          window.close();
        }, 1000);
      } catch (error) {
        console.error('Error communicating with parent window:', error);
      }
    }

    // Show appropriate toast based on result
    if (success) {
      toast.success('Onboarding completed successfully!');
    } else if (refresh) {
      toast.info('Please complete your onboarding to continue.');
    }
  }, [success, refresh, userId]);

  const handleContinue = () => {
    navigate('/settings');
  };

  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          {success ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-600">Onboarding Complete!</CardTitle>
              <CardDescription>
                Your payout account has been successfully set up. You can now receive payments.
              </CardDescription>
            </>
          ) : refresh ? (
            <>
              <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle className="text-blue-600">Continue Onboarding</CardTitle>
              <CardDescription>
                Please complete your account setup to start receiving payments.
              </CardDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-yellow-600">Onboarding Status</CardTitle>
              <CardDescription>
                Please check your account status in Settings.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleContinue} className="flex-1">
              Go to Settings
            </Button>
            {window.opener && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingComplete;