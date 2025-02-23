"use client"

import { useState } from 'react';
import { SceneInfo } from '../../lib/types';

interface FrameSelectorProps {
  scenes: SceneInfo[];
  onSend: (selectedScenes: SceneInfo[], notes: string) => void;
}

export function FrameSelector({ scenes, onSend }: FrameSelectorProps) {
  const [selectedScenes, setSelectedScenes] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');

  const toggleScene = (index: number) => {
    const newSelected = new Set(selectedScenes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedScenes(newSelected);
  };

  const handleSend = () => {
    const selectedSceneInfo = Array.from(selectedScenes).map(index => scenes[index]);
    onSend(selectedSceneInfo, notes);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Scene Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {scenes.map((scene, index) => (
          <div 
            key={index}
            className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedScenes.has(index) 
                ? 'border-primary ring-2 ring-primary ring-offset-2' 
                : 'border-transparent hover:border-primary/50'
            }`}
            onClick={() => toggleScene(index)}
            title={`Scene at ${formatTime(scene.timestamp)}`}
          >
            <img 
              src={scene.frameData} 
              alt={`Scene ${index + 1}`}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm">
              {formatTime(scene.timestamp)}
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              selectedScenes.has(index) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className={`${
                selectedScenes.has(index)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/80 text-foreground'
              } px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm`}>
                {selectedScenes.has(index) ? '✓ Selected' : 'Click to Select'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes and Actions */}
      <div className="bg-card rounded-lg p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Additional Notes</h4>
            <span className="text-sm text-muted-foreground">
              {selectedScenes.size} scene{selectedScenes.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, requirements, or any other relevant information about the selected scenes..."
            className="w-full h-32 p-4 rounded-lg bg-muted/50 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedScenes(new Set());
              setNotes('');
            }}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear Selection
          </button>
          <button
            onClick={handleSend}
            disabled={selectedScenes.size === 0}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Story from {selectedScenes.size} Scene{selectedScenes.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
