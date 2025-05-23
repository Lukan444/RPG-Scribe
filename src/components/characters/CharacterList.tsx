import React, { useState, useEffect } from 'react';
import { CharacterService } from '../../services/character.service';

interface CharacterListProps {
  worldId: string;
  campaignId: string;
}

export const CharacterList: React.FC<CharacterListProps> = ({ worldId, campaignId }) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const characterService = CharacterService.getInstance(worldId, campaignId);
        const { data } = await characterService.query();
        
        setCharacters(data);
      } catch (err) {
        console.error('Error fetching characters:', err);
        setError('Failed to load characters');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCharacters();
  }, [worldId, campaignId]);
  
  if (loading) return <div>Loading characters...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Characters</h2>
      <ul>
        {characters.map((character) => (
          <li key={character.id}>
            {character.name} - {character.race} {character.class}
          </li>
        ))}
      </ul>
    </div>
  );
};
