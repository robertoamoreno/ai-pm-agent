"use client"

import { useRef, useState, useEffect } from 'react';
import { detectSceneChanges } from '../../lib/video-utils';
import { FrameSelector } from './frame-selector';
import { SceneInfo } from '../../lib/types';
import { getSubtitlesForClip, type Subtitle } from '../../lib/srt-utils';

interface VideoPlayerProps {
  videoFile: File;
  onClipSelect: (scenes: SceneInfo[], notes: string, clipRange: { start: number; end: number }) => void;
  subtitles?: Subtitle[];
}

export function VideoPlayer({ videoFile, onClipSelect, subtitles = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedScenes, setDetectedScenes] = useState<SceneInfo[]>([]);
  const [clipSubtitles, setClipSubtitles] = useState<string>('');

  useEffect(() => {
    if (videoRef.current) {
      const videoURL = URL.createObjectURL(videoFile);
      videoRef.current.src = videoURL;
      return () => URL.revokeObjectURL(videoURL);
    }
  }, [videoFile]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSetClipPoint = () => {
    if (startTime === null) {
      setStartTime(currentTime);
    } else if (endTime === null) {
      const end = currentTime;
      setEndTime(end);
      
      // Get subtitles for the selected clip using actual timestamps
      if (subtitles.length > 0) {
        const clipText = getSubtitlesForClip(subtitles, startTime, end);
        setClipSubtitles(clipText);
      }
    } else {
      // Reset clip points
      setStartTime(currentTime);
      setEndTime(null);
      setDetectedScenes([]);
      setClipSubtitles('');
    }
  };

  const handleDetectScenes = async () => {
    if (startTime === null || endTime === null) {
      alert('Please select a clip first by setting start and end points.');
      return;
    }

    setIsProcessing(true);
    try {
      // Create a new Blob containing only the selected portion of the video
      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Detect scenes only within the selected clip
      const scenes = await detectSceneChanges(
        videoFile,
        20, // sensitivity threshold
        startTime,
        endTime
      );
      
      setDetectedScenes(scenes);
    } catch (error) {
      console.error('Error detecting scenes:', error);
      alert('Failed to detect scenes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFrameSelect = (selectedScenes: SceneInfo[], notes: string) => {
    if (startTime === null || endTime === null) return;
    
    // Pass clip subtitles directly to onClipSelect
    onClipSelect(selectedScenes, notes, { start: startTime, end: endTime });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="relative space-y-4">
        {/* Video Progress Bar */}
        <div className="absolute -top-6 left-0 right-0 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          {startTime !== null && (
            <div 
              className="absolute top-0 h-full bg-primary/30"
              style={{ 
                left: `${(startTime / duration) * 100}%`,
                right: endTime ? `${100 - (endTime / duration) * 100}%` : '0'
              }}
            />
          )}
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          className="w-full rounded-lg shadow-lg"
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md">
              <span className="text-sm font-medium">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
            </div>
            <button
              onClick={handleSetClipPoint}
              className={`px-4 py-2 rounded-md transition-colors ${
                startTime === null
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : endTime === null
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
              title={
                startTime === null
                  ? 'Set the starting point of your clip'
                  : endTime === null
                  ? 'Set the ending point of your clip'
                  : 'Clear the current clip selection'
              }
            >
              {startTime === null
                ? '📍 Set Start'
                : endTime === null
                ? '🎬 Set End'
                : '🔄 Reset Clip'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {startTime !== null && endTime !== null && (
              <span className="text-sm text-muted-foreground">
                Clip Duration: {formatTime(endTime - startTime)}
              </span>
            )}
            <button
              onClick={handleDetectScenes}
              disabled={isProcessing || startTime === null || endTime === null}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                isProcessing
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : startTime === null || endTime === null
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              title="Analyze the selected clip to detect scene changes"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>🎥</span>
                  <span>Detect Scenes</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* Clip Info & Subtitles */}
        {(startTime !== null || clipSubtitles) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startTime !== null && (
              <div className="bg-card p-4 rounded-lg shadow-sm space-y-2">
                <h4 className="text-sm font-medium">Selected Clip</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    Start: {formatTime(startTime)}
                  </span>
                  {endTime !== null && (
                    <>
                      <span>→</span>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        End: {formatTime(endTime)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {clipSubtitles && (
              <div className="bg-card p-4 rounded-lg shadow-sm space-y-2">
                <h4 className="text-sm font-medium">Clip Subtitles</h4>
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {clipSubtitles}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detected Scenes */}
      {detectedScenes.length > 0 && (
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Scene Selection</h3>
              <p className="text-sm text-muted-foreground">
                {detectedScenes.length} key moments detected. Select the most relevant scenes for your user story.
              </p>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
              {detectedScenes.length} scenes
            </div>
          </div>

          <FrameSelector 
            scenes={detectedScenes}
            onSend={handleFrameSelect} 
          />

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Scene Timeline</h4>
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  videoRef.current.currentTime = detectedScenes[0].timestamp;
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                Jump to First Scene
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {detectedScenes.map((scene, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.currentTime = scene.timestamp;
                  }}
                  className="bg-muted hover:bg-muted/80 rounded-md p-2 text-sm transition-colors"
                >
                  Scene {index + 1}: {formatTime(scene.timestamp)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
