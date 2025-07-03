import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Tablet, Smartphone, FileText, Mail, CreditCard } from 'lucide-react';

type PreviewMode = 'invoice' | 'email' | 'payment';
type BreakpointMode = 'desktop' | 'tablet' | 'mobile';

interface PreviewModeSelectorProps {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  breakpointMode: BreakpointMode;
  setBreakpointMode: (mode: BreakpointMode) => void;
}

export const PreviewModeSelector: React.FC<PreviewModeSelectorProps> = ({
  previewMode,
  setPreviewMode,
  breakpointMode,
  setBreakpointMode
}) => {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Preview Controls</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preview Mode Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preview Type</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={previewMode === 'invoice' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('invoice')}
              className="flex items-center space-x-2"
              size="sm"
            >
              <FileText className="w-4 h-4" />
              <span>Invoice</span>
            </Button>
            
            <Button
              variant={previewMode === 'email' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('email')}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </Button>
            
            <Button
              variant={previewMode === 'payment' ? 'default' : 'outline'}
              onClick={() => setPreviewMode('payment')}
              className="flex items-center space-x-2"
              size="sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment</span>
            </Button>
          </div>
        </div>

        {/* Breakpoint Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Device Preview</label>
          <div className="flex border rounded-md">
            <Button
              size="sm"
              variant={breakpointMode === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setBreakpointMode('desktop')}
              className="rounded-r-none border-r flex-1"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant={breakpointMode === 'tablet' ? 'default' : 'ghost'}
              onClick={() => setBreakpointMode('tablet')}
              className="rounded-none border-r flex-1"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant={breakpointMode === 'mobile' ? 'default' : 'ghost'}
              onClick={() => setBreakpointMode('mobile')}
              className="rounded-l-none flex-1"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Preview:</strong> {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)}</p>
          <p><strong>Device:</strong> {breakpointMode.charAt(0).toUpperCase() + breakpointMode.slice(1)}</p>
        </div>
      </CardContent>
    </Card>
  );
};