import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_METADATA, type PremiumFeature } from 'utils/featureGating';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: PremiumFeature;
  trigger?: string; // What action triggered the modal
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature, trigger }) => {
  const navigate = useNavigate();
  const featureInfo = FEATURE_METADATA[feature];

  const handleUpgrade = () => {
    navigate('/settings?tab=billing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <DialogTitle className="text-lg">Upgrade to Premium</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-left">
            Unlock <strong>{featureInfo.name}</strong> and more powerful features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Feature Highlight */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">{featureInfo.name}</h3>
                <p className="text-sm text-purple-700 mt-1">{featureInfo.description}</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {featureInfo.benefit}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Premium Features */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Premium also includes:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Advanced analytics and reporting
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Unlimited customers and invoices
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Priority customer support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Custom branding options
              </li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">€35<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              <div className="text-xs text-emerald-600 mt-1">Or €30/month when paid yearly</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;