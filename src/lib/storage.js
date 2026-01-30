const STORAGE_KEY = 'rigflipper_inventory_v1';

export const getParts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addPart = (part) => {
  const currentParts = getParts();
  const newPart = { 
    id: crypto.randomUUID(),
    dateAdded: new Date().toISOString(),
    ...part 
  };
  
  const updatedParts = [newPart, ...currentParts];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts;
};

export const deletePart = (id) => {
  const currentParts = getParts();
  const updatedParts = currentParts.filter(part => part.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts;
};

export const updatePart = (id, updates) => {
  const currentParts = getParts();
  const updatedParts = currentParts.map(part => part.id === id ? { ...part, ...updates } : part);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParts));
  return updatedParts;
};

export const importData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
};