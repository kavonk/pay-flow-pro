import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from 'components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Upload,
  Save,
  RefreshCw,
  Palette,
  Building,
  CreditCard,
  Mail,
  Zap,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  FileText,
  AlertTriangle,
  Undo2,
  Settings,
  Download,
  Check
} from 'lucide-react';
import brain from 'brain';
import { useUser } from '@stackframe/react';
import { BrandingSettingsRequest, SubscriptionPlan } from 'types';
import { ColorPicker } from 'utils/ColorPicker';
import { PreviewPanel } from 'utils/PreviewPanel';
import { SaveStateManager } from 'utils/SaveStateManager';
import { PreviewModeSelector } from 'utils/PreviewModeSelector';
import { DragDropUploader } from 'utils/DragDropUploader';

type PreviewMode = 'invoice' | 'email' | 'payment';
type BreakpointMode = 'desktop' | 'tablet' | 'mobile';

interface BrandingData {
  company_name?: string;
  primary_color?: string;
  accent_color?: string;
  logo_url?: string;
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  payment_terms?: string;
  email_signature?: string;
  email_footer_text?: string;
  white_label_enabled?: boolean;
  custom_domain?: string;
  custom_css?: string;
}

interface SubscriptionData {
  plan?: SubscriptionPlan;
  plan_id?: string;
}

const BrandingSettings: React.FC = () => {
  const user = useUser();
  
  // State Management
  const [formData, setFormData] = useState<BrandingData>({});
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<BrandingData>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('invoice');
  const [breakpointMode, setBreakpointMode] = useState<BreakpointMode>('desktop');
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load initial data
  useEffect(() => {
    loadBrandingSettings();
    loadSubscription();
  }, []);

  const loadBrandingSettings = async () => {
    try {
      const response = await brain.get_branding_settings();
      const data = await response.json();
      setFormData(data);
      setLastSavedState(data);
    } catch (error) {
      toast.error('Failed to load branding settings');
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await brain.get_current_subscription();
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Access Control
  const hasCustomBrandingAccess = () => {
    return subscription?.plan?.has_custom_branding === true;
  };

  const isEnterprise = () => {
    return subscription?.plan_id && subscription.plan_id.toLowerCase() === 'enterprise';
  };

  // Form Management
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasUnsavedChanges(JSON.stringify(newData) !== JSON.stringify(lastSavedState));
      return newData;
    });
  }, [lastSavedState]);

  const handleSave = async () => {
    if (!hasCustomBrandingAccess()) {
      toast.error('Upgrade to Pro plan to customize branding');
      return;
    }

    setSaving(true);
    try {
      const response = await brain.update_branding_settings(formData as BrandingSettingsRequest);
      if (response.ok) {
        const savedData = await response.json();
        setLastSavedState(savedData);
        setHasUnsavedChanges(false);
        toast.success('Branding settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setFormData(lastSavedState);
    setHasUnsavedChanges(false);
    toast.info('Changes reverted to last saved state');
  };

  const handleLogoUpload = async (file: File) => {
    if (!hasCustomBrandingAccess()) {
      toast.error('Upgrade to Pro plan to upload custom logo');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await brain.upload_logo(formData);
      if (response.ok) {
        const result = await response.json();
        updateFormData('logo_url', result.logo_url);
        toast.success('Logo uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Preview refreshed');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Professional Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Branding Settings</h1>
            <p className="text-muted-foreground mt-1">
              Customize your brand identity across invoices, emails, and payment pages
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Alert className="p-3 bg-amber-50 border-amber-200">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  You have unsaved changes
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              variant="outline"
              onClick={refreshPreview}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Preview
            </Button>
            
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={handleRevert}
                className="flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Revert
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={saving || !hasCustomBrandingAccess()}
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {!hasCustomBrandingAccess() && (
          <Alert>
            <Settings className="w-4 h-4" />
            <AlertDescription>
              Upgrade to Pro plan to access custom branding features.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Desktop Tabs - Hidden on mobile */}
            <div className="hidden md:block">
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                {/* Visual Branding Tab */}
                <TabsContent value="visual" className="space-y-6">
                  {/* Logo Upload Card */}
                  <Card className="shadow-sm border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Upload className="w-5 h-5" />
                        <span>Logo Upload</span>
                      </CardTitle>
                      <CardDescription>
                        Upload your company logo for invoices and emails (PNG, JPG, SVG)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <DragDropUploader
                        onUpload={handleLogoUpload}
                        uploading={uploading}
                        currentLogo={formData.logo_url}
                        disabled={!hasCustomBrandingAccess()}
                      />
                    </CardContent>
                  </Card>

                  {/* Color Scheme Card */}
                  <Card className="shadow-sm border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Palette className="w-5 h-5" />
                        <span>Color Scheme</span>
                      </CardTitle>
                      <CardDescription>
                        Choose colors that reflect your brand identity
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <ColorPicker
                        label="Primary Color"
                        value={formData.primary_color || '#3B82F6'}
                        onChange={(color) => updateFormData('primary_color', color)}
                        disabled={!hasCustomBrandingAccess()}
                      />
                      
                      <ColorPicker
                        label="Accent Color"
                        value={formData.accent_color || '#10B981'}
                        onChange={(color) => updateFormData('accent_color', color)}
                        disabled={!hasCustomBrandingAccess()}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business Details Tab */}
                <TabsContent value="business" className="space-y-6">
                  <Card className="shadow-sm border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Building className="w-5 h-5" />
                        <span>Company Information</span>
                      </CardTitle>
                      <CardDescription>
                        Essential business details that appear across all customer touchpoints
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="text-sm font-medium">Company Name *</Label>
                          <Input
                            id="company_name"
                            value={formData.company_name || ''}
                            onChange={(e) => updateFormData('company_name', e.target.value)}
                            placeholder="Acme Corporation"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="business_email" className="text-sm font-medium">Business Email *</Label>
                          <Input
                            id="business_email"
                            type="email"
                            value={formData.business_email || ''}
                            onChange={(e) => updateFormData('business_email', e.target.value)}
                            placeholder="hello@acme.com"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_phone" className="text-sm font-medium">Business Phone</Label>
                          <Input
                            id="business_phone"
                            value={formData.business_phone || ''}
                            onChange={(e) => updateFormData('business_phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website_url" className="text-sm font-medium">Website</Label>
                          <Input
                            id="website_url"
                            value={formData.website_url || ''}
                            onChange={(e) => updateFormData('website_url', e.target.value)}
                            placeholder="https://acme.com"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Branding Tab */}
                <TabsContent value="payment" className="space-y-6">
                  <Card className="shadow-sm border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Payment Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Configure payment page appearance and messaging
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="payment_terms" className="text-sm font-medium">Payment Terms</Label>
                        <Input
                          id="payment_terms"
                          value={formData.payment_terms || ''}
                          onChange={(e) => updateFormData('payment_terms', e.target.value)}
                          placeholder="Payment due within 30 days"
                          disabled={!hasCustomBrandingAccess()}
                          className="border-2 focus:border-blue-500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Email Templates Tab */}
                <TabsContent value="email" className="space-y-6">
                  <Card className="shadow-sm border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span>Email Settings</span>
                      </CardTitle>
                      <CardDescription>
                        Customize email templates and messaging
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="email_signature" className="text-sm font-medium">Email Signature</Label>
                        <Textarea
                          id="email_signature"
                          value={formData.email_signature || ''}
                          onChange={(e) => updateFormData('email_signature', e.target.value)}
                          placeholder="Best regards,\nYour Company Team"
                          disabled={!hasCustomBrandingAccess()}
                          className="border-2 focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile Accordion - Visible only on mobile */}
            <div className="md:hidden space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="visual">
                  <AccordionTrigger className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Visual Branding</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Logo Upload Card */}
                    <Card className="shadow-sm border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                          <Upload className="w-5 h-5" />
                          <span>Logo Upload</span>
                        </CardTitle>
                        <CardDescription>
                          Upload your company logo for invoices and emails
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <DragDropUploader
                          onUpload={handleLogoUpload}
                          uploading={uploading}
                          currentLogo={formData.logo_url}
                          disabled={!hasCustomBrandingAccess()}
                        />
                      </CardContent>
                    </Card>

                    {/* Color Scheme Card */}
                    <Card className="shadow-sm border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                          <Palette className="w-5 h-5" />
                          <span>Color Scheme</span>
                        </CardTitle>
                        <CardDescription>
                          Choose colors that reflect your brand identity
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <ColorPicker
                          label="Primary Color"
                          value={formData.primary_color || '#3B82F6'}
                          onChange={(color) => updateFormData('primary_color', color)}
                          disabled={!hasCustomBrandingAccess()}
                        />
                        
                        <ColorPicker
                          label="Accent Color"
                          value={formData.accent_color || '#10B981'}
                          onChange={(color) => updateFormData('accent_color', color)}
                          disabled={!hasCustomBrandingAccess()}
                        />
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business">
                  <AccordionTrigger className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>Business Details</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Card className="shadow-sm border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                          <Building className="w-5 h-5" />
                          <span>Company Information</span>
                        </CardTitle>
                        <CardDescription>
                          Essential business details
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name_mobile" className="text-sm font-medium">Company Name *</Label>
                          <Input
                            id="company_name_mobile"
                            value={formData.company_name || ''}
                            onChange={(e) => updateFormData('company_name', e.target.value)}
                            placeholder="Acme Corporation"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="business_email_mobile" className="text-sm font-medium">Business Email *</Label>
                          <Input
                            id="business_email_mobile"
                            type="email"
                            value={formData.business_email || ''}
                            onChange={(e) => updateFormData('business_email', e.target.value)}
                            placeholder="hello@acme.com"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_phone_mobile" className="text-sm font-medium">Business Phone</Label>
                          <Input
                            id="business_phone_mobile"
                            value={formData.business_phone || ''}
                            onChange={(e) => updateFormData('business_phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website_url_mobile" className="text-sm font-medium">Website</Label>
                          <Input
                            id="website_url_mobile"
                            value={formData.website_url || ''}
                            onChange={(e) => updateFormData('website_url', e.target.value)}
                            placeholder="https://acme.com"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment">
                  <AccordionTrigger className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Card className="shadow-sm border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5" />
                          <span>Payment Settings</span>
                        </CardTitle>
                        <CardDescription>
                          Configure payment page appearance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_terms_mobile" className="text-sm font-medium">Payment Terms</Label>
                          <Input
                            id="payment_terms_mobile"
                            value={formData.payment_terms || ''}
                            onChange={(e) => updateFormData('payment_terms', e.target.value)}
                            placeholder="Payment due within 30 days"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="email">
                  <AccordionTrigger className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Settings</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Card className="shadow-sm border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2">
                          <Mail className="w-5 h-5" />
                          <span>Email Settings</span>
                        </CardTitle>
                        <CardDescription>
                          Customize email templates
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label htmlFor="email_signature_mobile" className="text-sm font-medium">Email Signature</Label>
                          <Textarea
                            id="email_signature_mobile"
                            value={formData.email_signature || ''}
                            onChange={(e) => updateFormData('email_signature', e.target.value)}
                            placeholder="Best regards,\nYour Company Team"
                            disabled={!hasCustomBrandingAccess()}
                            className="border-2 focus:border-blue-500"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Right Panel - Enhanced Preview with Sticky Behavior */}
          <div className="space-y-6">
            {/* Preview Mode Selector */}
            <div className="sticky top-6 z-10">
              <PreviewModeSelector
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                breakpointMode={breakpointMode}
                setBreakpointMode={setBreakpointMode}
              />
            </div>

            {/* Preview Panel with Enhanced Styling */}
            <div className="sticky top-32">
              <PreviewPanel
                previewMode={previewMode}
                breakpointMode={breakpointMode}
                formData={formData}
                refreshKey={refreshKey}
              />
            </div>

            {/* Save State Manager */}
            <SaveStateManager
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={handleSave}
              onRevert={handleRevert}
              saving={saving}
              disabled={!hasCustomBrandingAccess()}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BrandingSettings;