import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Undo2, Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface SaveStateManagerProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onRevert: () => void;
  saving: boolean;
  disabled: boolean;
}

export const SaveStateManager: React.FC<SaveStateManagerProps> = ({
  hasUnsavedChanges,
  onSave,
  onRevert,
  saving,
  disabled
}) => {
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Save State Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">Unsaved Changes</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700">All Changes Saved</span>
                </>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {saving ? 'Saving...' : hasUnsavedChanges ? 'Auto-save disabled' : 'Ready'}
            </div>
          </div>

          {/* Warning Banner */}
          {hasUnsavedChanges && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                You have unsaved changes that will be lost if you navigate away.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onSave}
              disabled={saving || disabled || !hasUnsavedChanges}
              className="flex-1 flex items-center justify-center space-x-2"
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
                </>
              )}
            </Button>
            
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={onRevert}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Undo2 className="w-4 h-4" />
                <span>Revert</span>
              </Button>
            )}
          </div>

          {/* Upgrade Notice */}
          {disabled && (
            <Alert>
              <AlertDescription className="text-sm">
                Upgrade to Pro plan to save custom branding settings.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};