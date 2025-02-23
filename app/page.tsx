"use client"

import { useState } from 'react';
import { FileUpload } from '../components/ui/file-upload';
import { VideoPlayer } from '../components/ui/video-player';
import { StoryManager } from '../components/ui/story-manager';
import { generateUserStory } from '../lib/gemini-service';
import { Story, SceneInfo } from '../lib/types';
import { getSubtitlesForClip, parseSRT, type Subtitle } from '../lib/srt-utils';

interface VideoData {
  video: File | null;
  subtitles?: string;
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [parsedSubtitles, setParsedSubtitles] = useState<Subtitle[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const handleFileSelect = (files: VideoData) => {
    setVideoFile(files.video);
    if (files.subtitles) {
      try {
        // Parse the SRT content into structured subtitles
        const srtContent = files.subtitles.trim();
        if (!srtContent) {
          console.warn('Empty SRT content');
          setParsedSubtitles([]);
          return;
        }
        console.log('Parsing SRT content:', srtContent); // Debug log
        const parsed = parseSRT(srtContent);
        console.log('Parsed subtitles:', parsed); // Debug log
        setParsedSubtitles(parsed);
      } catch (error) {
        console.error('Failed to parse SRT:', error);
        setParsedSubtitles([]);
      }
    } else {
      setParsedSubtitles([]);
    }
  };

  const handleClipSelect = async (scenes: SceneInfo[], notes: string, clipRange: { start: number; end: number }) => {
    if (!videoFile) return;

    setIsLoading(true);
    try {
      // Get subtitles for the selected clip range
      const clipSubtitles = parsedSubtitles.length > 0
        ? getSubtitlesForClip(parsedSubtitles, clipRange.start, clipRange.end)
        : undefined;
      
      const content = await generateUserStory(scenes, notes, clipSubtitles);
      const newStory: Story = {
        id: crypto.randomUUID(),
        content,
        scenes,
        notes,
        clipRange,
        timestamp: Date.now()
      };
      
      setStories(prevStories => [...prevStories, newStory]);
    } catch (error) {
      console.error('Error generating user story:', error);
      alert('Failed to generate user story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = (storyId: string) => {
    setStories(prevStories => prevStories.filter(story => story.id !== storyId));
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">PM AI Agent</h1>
              <a
                href="/integrations"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Integrations
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${videoFile ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${videoFile ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
                <span className="hidden sm:inline">Upload</span>
              </div>
              <div className="w-8 h-px bg-border" />
              <div className={`flex items-center gap-2 ${showVideoPlayer ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${showVideoPlayer ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
                <span className="hidden sm:inline">Select Clips</span>
              </div>
              <div className="w-8 h-px bg-border" />
              <div className={`flex items-center gap-2 ${stories.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stories.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
                <span className="hidden sm:inline">Stories</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-12">
        {/* Introduction */}
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Generate User Stories from Video</h2>
          <p className="text-muted-foreground">
            Transform your video content into detailed user stories automatically. Upload a video, 
            select key moments, and let AI generate comprehensive user stories for your product management needs.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="relative">
          <FileUpload 
            onFileSelect={(files) => {
              handleFileSelect(files);
              setShowVideoPlayer(true);
            }} 
          />
        </div>

        {/* Video Player Section */}
        {videoFile && showVideoPlayer && (
          <div id="video-player-section" className="relative space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Video Clip Selection</h3>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Upload
              </button>
            </div>
            <VideoPlayer 
              videoFile={videoFile}
              subtitles={parsedSubtitles}
              onClipSelect={(scenes, notes, clipRange) => handleClipSelect(scenes, notes, clipRange)} 
            />
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4">
              <div className="animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-center text-muted-foreground">
                Analyzing scenes and generating user story...
              </p>
            </div>
          </div>
        )}

        {/* Stories Section */}
        {stories.length > 0 && (
          <div className="relative space-y-6">
            <h3 className="text-2xl font-semibold">Generated Stories</h3>
            <StoryManager 
              stories={stories}
              onDelete={handleDeleteStory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
