"use client"

import { useState } from 'react';
import { Story } from '../../lib/types';
import { ClickUpExportModal } from './clickup-export-modal';
import { ClickUpService } from '../../lib/clickup-service';

interface StoryManagerProps {
  stories: Story[];
  onDelete: (storyId: string) => void;
}

export function StoryManager({ stories, onDelete }: StoryManagerProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [storyToExport, setStoryToExport] = useState<Story | null>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExportClick = (story: Story) => {
    setStoryToExport(story);
    setExportModalOpen(true);
  };

  const handleExport = async (listId: string) => {
    if (!storyToExport) return;

    const tokenResponse = await fetch('/api/integrations/clickup/token');
    if (!tokenResponse.ok) {
      throw new Error('ClickUp integration not configured');
    }

    const { token } = await tokenResponse.json();
    const clickupService = new ClickUpService(token);
    
    // Get the list's default status
    const defaultStatus = await clickupService.getDefaultStatus(listId);

    // Format the story content for ClickUp using markdown
    const task = {
      name: `User Story: ${storyToExport.content.split('\n')[0]}`, // Use first line as title
      markdown_content: [
        storyToExport.content,
        '',
        '---',
        '',
        '### Metadata',
        `- **Clip Duration:** ${formatTime(storyToExport.clipRange.end - storyToExport.clipRange.start)}`,
        `- **Timestamp:** ${formatDate(storyToExport.timestamp)}`,
        storyToExport.notes ? `\n### Notes\n${storyToExport.notes}` : '',
      ].join('\n'),
      status: defaultStatus,
      priority: 3, // Normal priority
      tags: ['AI Generated', 'User Story'],
      notify_all: false,
      check_required_custom_fields: false
    };

    try {
      // Create the task
      const createdTask = await clickupService.createTask(listId, task);

      // Show loading message for attachments
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center';
      modal.innerHTML = `
        <div class="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4">
          <div class="animate-pulse flex items-center justify-center">
            <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="text-center text-muted-foreground" id="upload-progress">
            Uploading attachments (0/${storyToExport.scenes.length})...
          </p>
        </div>
      `;
      document.body.appendChild(modal);

      // Convert base64 images to files and upload them
      for (let i = 0; i < storyToExport.scenes.length; i++) {
        const scene = storyToExport.scenes[i];
        
        // Update progress message
        const progressText = document.getElementById('upload-progress');
        if (progressText) {
          progressText.textContent = `Uploading attachments (${i + 1}/${storyToExport.scenes.length})...`;
        }

        // Convert base64 to blob
        const base64Response = await fetch(scene.frameData);
        const blob = await base64Response.blob();
        
        // Create a file from the blob
        const file = new File([blob], `scene-${i + 1}.jpg`, { type: 'image/jpeg' });
        
        // Upload the file as an attachment
        await clickupService.addAttachment(createdTask.id, file);
      }

      // Remove loading modal
      document.body.removeChild(modal);
    } catch (error) {
      // If there's an error, ensure the loading modal is removed
      const modal = document.querySelector('.fixed.inset-0.bg-background\\/80');
      if (modal) {
        document.body.removeChild(modal);
      }
      throw error; // Re-throw the error to be handled by the modal's error handling
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Generated Stories</h2>
          <p className="text-sm text-muted-foreground">
            Your AI-generated user stories from selected video clips
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full">
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stories.map((story) => (
          <div
            key={story.id}
            className={`group bg-card rounded-lg shadow-sm transition-all ${
              selectedStory?.id === story.id
                ? 'ring-2 ring-primary'
                : 'hover:shadow-md'
            }`}
          >
            {/* Story Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      {formatTime(story.clipRange.end - story.clipRange.start)} duration
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {story.scenes.length} scenes
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(story.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportClick(story)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80 p-2"
                    title="Export to ClickUp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(story.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 p-2"
                    title="Delete story"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div className="p-6 space-y-6">
              {/* Scene Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {story.scenes.slice(0, 4).map((scene, index) => (
                  <div 
                    key={index} 
                    className="aspect-video rounded-md overflow-hidden bg-muted"
                    title={`Scene at ${formatTime(scene.timestamp)}`}
                  >
                    <img
                      src={scene.frameData}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform"
                    />
                  </div>
                ))}
              </div>

              {/* Story Text */}
              {selectedStory?.id === story.id ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">
                        {story.content}
                      </pre>
                    </div>
                  </div>
                  {story.notes && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {story.notes}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Show Less
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedStory(story)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Show Full Story
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Clip: {formatTime(story.clipRange.start)} - {formatTime(story.clipRange.end)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ClickUpExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setStoryToExport(null);
        }}
        onExport={handleExport}
      />
    </div>
  );
}
