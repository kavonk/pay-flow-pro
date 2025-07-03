import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertTriangle } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

// WCAG contrast validation
const getContrastRatio = (color1: string, color2: string) => {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const validateContrast = (color: string) => {
  const whiteContrast = getContrastRatio(color, '#FFFFFF');
  const blackContrast = getContrastRatio(color, '#000000');
  const ratio = Math.max(whiteContrast, blackContrast);
  return {
    passesAA: ratio >= 4.5,
    ratio: ratio
  };
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, disabled }) => {
  const [contrast, setContrast] = useState<{ passesAA: boolean; ratio: number } | null>(null);

  useEffect(() => {
    if (value && value.match(/^#[0-9A-F]{6}$/i)) {
      setContrast(validateContrast(value));
    } else {
      setContrast(null);
    }
  }, [value]);

  const handleColorChange = (newColor: string) => {
    if (!disabled) {
      onChange(newColor);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="flex items-center space-x-4">
        {/* Visual Color Wheel */}
        <div className="relative">
          <div 
            className="w-16 h-16 rounded-full border-4 border-gray-200 cursor-pointer transition-all hover:scale-105 hover:border-gray-300 shadow-md"
            style={{ backgroundColor: value }}
            onClick={() => !disabled && document.getElementById(`color-input-${label}`)?.click()}
          >
            <input
              id={`color-input-${label}`}
              type="color"
              value={value}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-full opacity-0 cursor-pointer absolute inset-0"
              disabled={disabled}
            />
          </div>
          
          {contrast && (
            <div className="absolute -bottom-2 -right-2">
              {contrast.passesAA ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hex Input */}
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-sm border-2 focus:border-blue-500"
            disabled={disabled}
            maxLength={7}
          />
        </div>
      </div>

      {/* Contrast Validation */}
      {contrast && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant={contrast.passesAA ? "default" : "secondary"} className="text-xs">
              {contrast.passesAA ? 'WCAG AA ✓' : 'WCAG AA ✗'}
            </Badge>
            <span className="text-xs text-gray-500">
              Contrast: {contrast.ratio.toFixed(1)}:1
            </span>
          </div>
          
          {!contrast.passesAA && (
            <Alert className="p-2">
              <AlertTriangle className="w-3 h-3" />
              <AlertDescription className="text-xs">
                Consider using a darker or lighter shade for better accessibility
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};