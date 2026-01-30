// src/lib/storage.js

const STORAGE_KEY = 'rigflipper_inventory_v1';

// Get all parts from storage
export const getParts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Add a single part
export const addPart = (part) => {
  const currentParts = getParts();
  const newPart = { 
    id: crypto.randomUUID(), // Generates a unique ID locally
    dateAdded: new Date().toISOString(),
    ...part 
  };
  
  const updatedParts = [newPart, ...currentParts];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts; // Return new list to update UI immediately
};

// Delete a part
export const deletePart = (id) => {
  const currentParts = getParts();
  const updatedParts = currentParts.filter(part => part.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts;
};

// Update a part (for selling or editing)
export const updatePart = (id, updates) => {
  const currentParts = getParts();
  const updatedParts = currentParts.map(part => part.id === id ? { ...part, ...updates } : part);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts;
};