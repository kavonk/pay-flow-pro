import React, { useState } from "react";
import AppLayout from 'components/AppLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, AlertCircle, Crown } from "lucide-react";
import { DunningRule, DunningRuleCreate, DunningRuleUpdate } from "types";
import { useDunningRules, useCreateDunningRule, useUpdateDunningRule, useDeleteDunningRule } from "utils/queryHooks";
import FeatureGate from 'components/FeatureGate';
import { PREMIUM_FEATURES } from 'utils/featureGating';
import UpgradeModal from 'components/UpgradeModal';

// Form component for creating/editing dunning rules
const DunningRuleForm = ({
  rule,
  onSave,
  onCancel,
  isLoading = false,
}: {
  rule?: DunningRule;
  onSave: (ruleData: DunningRuleCreate | DunningRuleUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    offset_days: rule?.offset_days || 0,
    channel: rule?.channel || "email",
    message: rule?.message || "",
    is_active: rule?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., First Reminder"
          required
        />
      </div>

      <div>
        <Label htmlFor="offset_days">Days Offset</Label>
        <Input
          id="offset_days"
          type="number"
          value={formData.offset_days}
          onChange={(e) => setFormData({ ...formData, offset_days: parseInt(e.target.value) })}
          placeholder="e.g., 7 (positive = after due, negative = before due)"
          required
        />
      </div>

      <div>
        <Label htmlFor="channel">Channel</Label>
        <Select
          value={formData.channel}
          onValueChange={(value) => setFormData({ ...formData, channel: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message Template</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Your payment is overdue. Please pay immediately."
          rows={3}
          required
        />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (rule ? "Update" : "Create")} Rule
        </Button>
      </DialogFooter>
    </form>
  );
};

const DunningRules = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DunningRule | undefined>(undefined);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Use React Query hooks for optimized data fetching
  const { data: rules = [], isLoading, error } = useDunningRules();
  const createRuleMutation = useCreateDunningRule();
  const updateRuleMutation = useUpdateDunningRule();
  const deleteRuleMutation = useDeleteDunningRule();

  const handleSave = async (ruleData: DunningRuleCreate | DunningRuleUpdate) => {
    try {
      if (editingRule) {
        await updateRuleMutation.mutateAsync({ ruleId: editingRule.id!, ruleData });
      } else {
        await createRuleMutation.mutateAsync(ruleData as DunningRuleCreate);
      }
      setIsFormOpen(false);
      setEditingRule(undefined);
    } catch (err) {
      // Error handling is done in the mutation hooks
      console.error('Failed to save rule:', err);
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRuleMutation.mutateAsync(ruleId);
    } catch (err) {
      // Error handling is done in the mutation hook
      console.error('Failed to delete rule:', err);
    }
  };

  const openEditForm = (rule: DunningRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Dunning Rules</h1>
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-muted-foreground mt-1">
              Manage automated payment reminders and follow-up rules
            </p>
          </div>
          
          <FeatureGate
            feature={PREMIUM_FEATURES.DUNNING_AUTOMATION}
            fallback={
              <Button onClick={() => setShowUpgradeModal(true)} variant="outline">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade for Dunning Rules
              </Button>
            }
          >
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </FeatureGate>
        </div>

        <FeatureGate
          feature={PREMIUM_FEATURES.DUNNING_AUTOMATION}
          fallback={
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Crown className="h-12 w-12 text-yellow-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Premium Feature</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1 max-w-md mx-auto">
                      Automated dunning rules are available with our Premium plan.
                      Set up intelligent payment reminders to improve your collection rates.
                    </p>
                  </div>
                  <Button onClick={() => setShowUpgradeModal(true)} className="bg-yellow-600 hover:bg-yellow-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          }
        >
          {error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error instanceof Error ? error.message : 'Failed to load dunning rules'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active Reminder Rules</CardTitle>
              <CardDescription>
                Automated reminders sent to customers with overdue invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No dunning rules created yet.</p>
                  <Button 
                    onClick={() => setIsFormOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Send <span className="font-medium">{rule.channel}</span> reminder{' '}
                          <span className="font-medium">{Math.abs(rule.offset_days)}</span> days{' '}
                          <span className="font-medium">{rule.offset_days >= 0 ? 'after' : 'before'}</span> due date.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FeatureGate>
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={PREMIUM_FEATURES.DUNNING_AUTOMATION}
        />

        {/* Form in Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Dunning Rule" : "Create Dunning Rule"}
              </DialogTitle>
              <DialogDescription>
                Define when and how to send reminders for this rule.
              </DialogDescription>
            </DialogHeader>
            <DunningRuleForm
              rule={editingRule}
              onSave={handleSave}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingRule(undefined);
              }}
              isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DunningRules;