import { useState, useCallback } from 'react';
import { useFeatureAccess, type PremiumFeature } from './featureGating';

/**
 * Hook for managing upgrade prompts throughout the app
 */
export const useUpgradePrompt = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<PremiumFeature | null>(null);
  const [trigger, setTrigger] = useState<string>('');
  const { hasFeature, isBasicUser } = useFeatureAccess();

  const promptUpgrade = useCallback((feature: PremiumFeature, triggerSource: string = 'unknown') => {
    const hasAccess = hasFeature(feature);
    
    if (!hasAccess && isBasicUser) {
      setCurrentFeature(feature);
      setTrigger(triggerSource);
      setIsModalOpen(true);
      return true; // Upgrade prompt shown
    }
    
    return false; // No upgrade prompt needed
  }, [hasFeature, isBasicUser]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentFeature(null);
    setTrigger('');
  }, []);

  return {
    isModalOpen,
    currentFeature,
    trigger,
    promptUpgrade,
    closeModal,
    hasFeature,
    isBasicUser
  };
};

export default useUpgradePrompt;