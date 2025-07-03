import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Banknote, ArrowRight, AlertCircle } from 'lucide-react';

interface PayoutAccountRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal that explains payout account requirement and guides users to setup
 * Displayed when user tries to create an invoice without a connected payout account
 */
const PayoutAccountRequiredModal: React.FC<PayoutAccountRequiredModalProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate('/settings');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Payout Account Required</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Before creating invoices, you need to connect a payout account to receive payments from your customers.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This ensures your customers can pay invoices and you can receive funds securely through Stripe.
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              What you'll need to setup:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Business information and tax details
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Bank account details for payouts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Identity verification (if required)
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGoToSettings}
            className="gap-2"
          >
            Go to Settings
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutAccountRequiredModal;