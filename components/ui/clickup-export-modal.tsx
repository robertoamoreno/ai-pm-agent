"use client"

import { useState, useEffect } from 'react';
import { ClickUpService, ClickUpSpace, ClickUpList } from '../../lib/clickup-service';

interface ClickUpExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (listId: string) => Promise<void>;
}

export function ClickUpExportModal({ isOpen, onClose, onExport }: ClickUpExportModalProps) {
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSpaces();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSpace) {
      loadLists(selectedSpace);
    } else {
      setLists([]);
      setSelectedList('');
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenResponse = await fetch('/api/integrations/clickup/token');
      if (!tokenResponse.ok) {
        throw new Error('ClickUp integration not configured');
      }

      const { token } = await tokenResponse.json();
      const clickupService = new ClickUpService(token);
      const spacesList = await clickupService.getSpaces();
      setSpaces(spacesList);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load spaces');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLists = async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenResponse = await fetch('/api/integrations/clickup/token');
      if (!tokenResponse.ok) {
        throw new Error('ClickUp integration not configured');
      }

      const { token } = await tokenResponse.json();
      const clickupService = new ClickUpService(token);
      const listsList = await clickupService.getLists(spaceId);
      setLists(listsList);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedList) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await onExport(selectedList);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export to ClickUp');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
        <div className="bg-card rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Export to ClickUp</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="space" className="text-sm font-medium">
                Space
              </label>
              <select
                id="space"
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                className="w-full px-3 py-2 rounded-md border bg-background"
                disabled={isLoading}
              >
                <option value="">Select a space</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSpace && (
              <div className="space-y-2">
                <label htmlFor="list" className="text-sm font-medium">
                  List
                </label>
                <select
                  id="list"
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                  disabled={isLoading}
                >
                  <option value="">Select a list</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md hover:bg-muted"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!selectedList || isLoading}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                !selectedList || isLoading
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                'Export to ClickUp'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
