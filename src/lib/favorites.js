/**
 * Favorites Management
 * Store user's favorite workflow hashes in localStorage (per wallet address)
 */

const STORAGE_KEY_PREFIX = 'carge_favorites_';

/**
 * Get favorites for a specific wallet address
 * @param {string} walletAddress - User's wallet address
 * @returns {string[]} Array of workflow hashes
 */
export const getFavorites = (walletAddress) => {
  if (!walletAddress) return [];
  
  try {
    const key = `${STORAGE_KEY_PREFIX}${walletAddress}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading favorites:', error);
    return [];
  }
};

/**
 * Add a workflow to favorites
 * @param {string} walletAddress - User's wallet address
 * @param {string} workflowHash - Workflow hash to add
 * @returns {boolean} Success status
 */
export const addFavorite = (walletAddress, workflowHash) => {
  if (!walletAddress || !workflowHash) return false;
  
  try {
    const favorites = getFavorites(walletAddress);
    if (favorites.includes(workflowHash)) {
      return true; // Already a favorite
    }
    
    favorites.push(workflowHash);
    const key = `${STORAGE_KEY_PREFIX}${walletAddress}`;
    localStorage.setItem(key, JSON.stringify(favorites));
    console.log(`⭐ Added favorite: ${workflowHash}`);
    return true;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
};

/**
 * Remove a workflow from favorites
 * @param {string} walletAddress - User's wallet address
 * @param {string} workflowHash - Workflow hash to remove
 * @returns {boolean} Success status
 */
export const removeFavorite = (walletAddress, workflowHash) => {
  if (!walletAddress || !workflowHash) return false;
  
  try {
    const favorites = getFavorites(walletAddress);
    const filtered = favorites.filter(h => h !== workflowHash);
    
    const key = `${STORAGE_KEY_PREFIX}${walletAddress}`;
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`⭐ Removed favorite: ${workflowHash}`);
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

/**
 * Toggle a workflow favorite status
 * @param {string} walletAddress - User's wallet address
 * @param {string} workflowHash - Workflow hash to toggle
 * @returns {boolean} New favorite status (true if now favorited)
 */
export const toggleFavorite = (walletAddress, workflowHash) => {
  const favorites = getFavorites(walletAddress);
  const isFavorite = favorites.includes(workflowHash);
  
  if (isFavorite) {
    removeFavorite(walletAddress, workflowHash);
    return false;
  } else {
    addFavorite(walletAddress, workflowHash);
    return true;
  }
};

/**
 * Check if a workflow is favorited
 * @param {string} walletAddress - User's wallet address
 * @param {string} workflowHash - Workflow hash to check
 * @returns {boolean} True if favorited
 */
export const isFavorite = (walletAddress, workflowHash) => {
  const favorites = getFavorites(walletAddress);
  return favorites.includes(workflowHash);
};

