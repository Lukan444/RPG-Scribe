import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { RPGWorld } from '../models/RPGWorld';
import { Campaign } from '../models/Campaign';
import { RPGWorldService } from '../services/rpgWorld.service';
import { UserPreferencesService } from '../services/userPreferences.service';
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
  autoSelectLastWorld: () => Promise<boolean>;
}

// Create RPGWorld context
const RPGWorldContext = createContext<RPGWorldContextType | undefined>(undefined);

// RPGWorld provider component
export function RPGWorldProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { worldId, campaignId } = useParams<{ worldId?: string; campaignId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentWorld, setCurrentWorld] = useState<RPGWorld | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [worldLoading, setWorldLoading] = useState<boolean>(false);
  const [campaignLoading, setCampaignLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const rpgWorldService = useMemo(() => new RPGWorldService(), []);
  const userPreferencesService = useMemo(() => new UserPreferencesService(), []);

  // Auto-select last world function
  const autoSelectLastWorld = async (): Promise<boolean> => {
    if (!currentUser?.uid) {
      console.log('No user available for auto-selection');
      return false;
    }

    try {
      setWorldLoading(true);
      setError(null);

      // Check if auto-select is enabled
      const shouldAutoSelect = await userPreferencesService.shouldAutoSelectLastWorld(currentUser.uid);
      if (!shouldAutoSelect) {
        console.log('Auto-select is disabled');
        return false;
      }

      // Get last selected world ID
      const lastWorldId = await userPreferencesService.getLastSelectedWorldId(currentUser.uid);
      if (!lastWorldId) {
        console.log('No last selected world found');
        return false;
      }

      // Try to load the world
      const world = await rpgWorldService.getWorldWithCampaigns(lastWorldId);
      if (!world) {
        console.log('Last selected world no longer exists');
        return false;
      }

      // Verify user still has access to this world
      const userWorlds = await rpgWorldService.getWorldsByUser(currentUser.uid);
      const hasAccess = userWorlds.some(w => w.id === lastWorldId);

      if (!hasAccess) {
        console.log('User no longer has access to last selected world');
        return false;
      }

      // Set the world
      setCurrentWorld(world);
      console.log('Auto-selected world:', world.name);
      return true;
    } catch (err: any) {
      console.error('Error auto-selecting world:', err);
      setError(err.message || 'Failed to auto-select world');
      return false;
    } finally {
      setWorldLoading(false);
    }
  };

  // Load RPG World based on URL params or auto-select
  useEffect(() => {
    const loadWorld = async () => {
      if (worldId) {
        // Load specific world from URL
        try {
          setWorldLoading(true);
          setError(null);

          // Get world with campaigns
          const result = await rpgWorldService.getWorldWithCampaigns(worldId);
          setCurrentWorld(result);

          // Save as last selected world
          if (currentUser?.uid) {
            await userPreferencesService.setLastSelectedWorld(currentUser.uid, worldId);
          }

          // If there's a campaignId in the URL, set the current campaign
          if (campaignId && result.campaigns) {
            const campaign = result.campaigns.find(c => c.id === campaignId);
            if (campaign) {
              setCurrentCampaign(campaign);
              // Save as last selected campaign
              if (currentUser?.uid) {
                await userPreferencesService.setLastSelectedCampaign(currentUser.uid, campaignId);
              }
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
      } else {
        // No world in URL, clear current world
        setCurrentWorld(null);
        setCurrentCampaign(null);
      }
    };

    loadWorld();
  }, [worldId, campaignId, rpgWorldService, userPreferencesService, currentUser?.uid]);

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
    autoSelectLastWorld,
  }), [
    currentWorld,
    currentCampaign,
    worldLoading,
    campaignLoading,
    error,
    autoSelectLastWorld
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
