import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { RPGWorld } from '../models/RPGWorld';
import { Campaign } from '../models/Campaign';
import { RPGWorldService } from '../services/rpgWorld.service';
import { useAuth } from './AuthContext';

// Define RPGWorld context type
interface RPGWorldContextType {
  currentWorld: RPGWorld | null;
  currentCampaign: Campaign | null;
  worldLoading: boolean;
  campaignLoading: boolean;
  error: string | null;
  setCurrentWorld: (world: RPGWorld | null) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  clearError: () => void;
}

// Create RPGWorld context
const RPGWorldContext = createContext<RPGWorldContextType | undefined>(undefined);

// RPGWorld provider component
export function RPGWorldProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId?: string }>();
  const location = useLocation();
  
  const [currentWorld, setCurrentWorld] = useState<RPGWorld | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [worldLoading, setWorldLoading] = useState<boolean>(false);
  const [campaignLoading, setCampaignLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const rpgWorldService = useMemo(() => new RPGWorldService(), []);

  // Load RPG World based on URL params
  useEffect(() => {
    const loadWorld = async () => {
      if (!worldId) {
        setCurrentWorld(null);
        return;
      }

      try {
        setWorldLoading(true);
        setError(null);

        // Get world with campaigns
        const result = await rpgWorldService.getWorldWithCampaigns(worldId);
        setCurrentWorld(result);
        
        // If there's a campaignId in the URL, set the current campaign
        if (campaignId && result.campaigns) {
          const campaign = result.campaigns.find(c => c.id === campaignId);
          if (campaign) {
            setCurrentCampaign(campaign);
          } else {
            setCurrentCampaign(null);
          }
        } else {
          setCurrentCampaign(null);
        }
      } catch (err: any) {
        console.error('Error loading RPG World:', err);
        setError(err.message || 'Failed to load RPG World');
      } finally {
        setWorldLoading(false);
      }
    };

    loadWorld();
  }, [worldId, campaignId, rpgWorldService]);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Create context value
  const value = useMemo(() => ({
    currentWorld,
    currentCampaign,
    worldLoading,
    campaignLoading,
    error,
    setCurrentWorld,
    setCurrentCampaign,
    clearError,
  }), [
    currentWorld,
    currentCampaign,
    worldLoading,
    campaignLoading,
    error
  ]);

  return <RPGWorldContext.Provider value={value}>{children}</RPGWorldContext.Provider>;
}

// Custom hook to use RPGWorld context
export function useRPGWorld() {
  const context = useContext(RPGWorldContext);
  if (context === undefined) {
    throw new Error('useRPGWorld must be used within an RPGWorldProvider');
  }
  return context;
}
