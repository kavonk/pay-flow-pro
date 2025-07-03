import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Mail, Phone, Users, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';

interface Props {
  children: React.ReactNode;
}

const EnterpriseContactDialog = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    company_size: '',
    monthly_invoice_volume: '',
    current_solution: '',
    message: '',
    request_demo: false,
    preferred_contact_method: 'email'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await brain.submit_enterprise_contact(formData);
      const data = await response.json();

      if (data.success) {
        toast.success(data.message, {
          duration: 6000,
        });
        setOpen(false);
        setFormData({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          company_size: '',
          monthly_invoice_volume: '',
          current_solution: '',
          message: '',
          request_demo: false,
          preferred_contact_method: 'email'
        });
      } else {
        throw new Error(data.message || 'Failed to submit inquiry');
      }
    } catch (error) {
      console.error('Enterprise contact error:', error);
      toast.error('Failed to submit your inquiry. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white mb-2">
            Get Enterprise Pricing
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Tell us about your business and we'll prepare a custom proposal with Enterprise features, 
            dedicated support, and volume pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-purple-400" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name" className="text-gray-300">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Acme Corp"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_name" className="text-gray-300">Your Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="john@acmecorp.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-purple-400" />
              Business Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_size" className="text-gray-300">Company Size</Label>
                <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="monthly_invoice_volume" className="text-gray-300">Monthly Invoice Volume</Label>
                <Select value={formData.monthly_invoice_volume} onValueChange={(value) => handleInputChange('monthly_invoice_volume', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select invoice volume" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="<100">Less than 100</SelectItem>
                    <SelectItem value="100-1000">100-1,000</SelectItem>
                    <SelectItem value="1000-5000">1,000-5,000</SelectItem>
                    <SelectItem value="5000+">5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="current_solution" className="text-gray-300">Current Invoicing Solution</Label>
              <Input
                id="current_solution"
                value={formData.current_solution}
                onChange={(e) => handleInputChange('current_solution', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="QuickBooks, Xero, FreshBooks, Custom solution, etc."
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-purple-400" />
              Additional Information
            </h3>
            
            <div>
              <Label htmlFor="message" className="text-gray-300">Tell us about your needs</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                placeholder="Tell us about your invoicing challenges, integration needs, or specific Enterprise features you're interested in..."
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-purple-400" />
              Preferences
            </h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="request_demo"
                checked={formData.request_demo}
                onCheckedChange={(checked) => handleInputChange('request_demo', !!checked)}
                className="border-gray-600"
              />
              <Label htmlFor="request_demo" className="text-gray-300">
                I'd like to schedule a personalized demo
              </Label>
            </div>

            <div>
              <Label className="text-gray-300 mb-3 block">Preferred Contact Method</Label>
              <RadioGroup
                value={formData.preferred_contact_method}
                onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email_contact" className="border-gray-600" />
                  <Label htmlFor="email_contact" className="text-gray-300 flex items-center">
                    <Mail className="mr-1 h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone_contact" className="border-gray-600" />
                  <Label htmlFor="phone_contact" className="text-gray-300 flex items-center">
                    <Phone className="mr-1 h-4 w-4" />
                    Phone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="either" id="either_contact" className="border-gray-600" />
                  <Label htmlFor="either_contact" className="text-gray-300">
                    Either
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.company_name || !formData.contact_name || !formData.email}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? 'Submitting...' : 'Get Enterprise Pricing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseContactDialog;