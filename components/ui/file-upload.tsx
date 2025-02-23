"use client"

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseSRT, validateSRTWithVideo } from '../../lib/srt-utils';

interface FileUploadProps {
  onFileSelect: (files: { video: File | null; subtitles?: string }) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleTranscribe = async () => {
    if (!videoFile) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transcribe video');
      }

      const srtContent = await response.text();
      
      // Create a File object from the SRT content
      const srtFile = new File([srtContent], 'transcript.srt', {
        type: 'application/x-subrip'
      });
      setSrtFile(srtFile);
      
      onFileSelect({ video: videoFile, subtitles: srtContent });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to transcribe video');
    } finally {
      setIsTranscribing(false);
    }
  };

  const processSRTFile = async (file: File, videoDuration: number) => {
    try {
      const text = await file.text();
      console.log('Processing SRT content:', text); // Debug log
      
      const subtitles = parseSRT(text);
      console.log('Parsed subtitles:', subtitles); // Debug log
      
      // Validate SRT timing with video duration
      if (!validateSRTWithVideo(subtitles, videoDuration)) {
        throw new Error('SRT file timings do not match video duration');
      }

      setSrtFile(file);
      return text;
    } catch (error) {
      console.error('SRT processing error:', error); // Debug log
      setError(error instanceof Error ? error.message : 'Failed to process SRT file');
      setSrtFile(null);
      return null;
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    for (const file of acceptedFiles) {
      if (file.type.startsWith('video/')) {
        try {
          const duration = await getVideoDuration(file);
          setVideoFile(file);
          
          // If we already have an SRT file, reprocess it with the new video
          if (srtFile) {
            const srtContent = await processSRTFile(srtFile, duration);
            if (srtContent) {
              onFileSelect({ video: file, subtitles: srtContent });
            }
          } else {
            onFileSelect({ video: file });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to process video file');
          setVideoFile(null);
        }
      } else if (file.name.endsWith('.srt')) {
        if (!videoFile) {
          setError('Please upload a video file first');
          return;
        }

        // Quick size check for obviously invalid files
        if (file.size === 0) {
          setError('SRT file is empty');
          return;
        }

        if (file.size > 1024 * 1024) { // 1MB limit
          setError('SRT file is too large. Maximum size is 1MB.');
          return;
        }

        try {
          const duration = await getVideoDuration(videoFile);
          const srtContent = await processSRTFile(file, duration);
          if (srtContent) {
            onFileSelect({ video: videoFile, subtitles: srtContent });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to process SRT file');
        }
      }
    }
  }, [videoFile, srtFile, onFileSelect]);

  const VideoUpload = () => {
    const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } = useDropzone({
      onDrop,
      accept: {
        'video/*': [],
      },
      multiple: false,
      disabled: !!videoFile
    });

    return (
      <div
        {...getVideoRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${!videoFile ? (isDragging ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary hover:bg-secondary/20')
            : 'border-primary bg-primary/5'}`}
        onDragEnter={() => !videoFile && setIsDragging(true)}
        onDragLeave={() => !videoFile && setIsDragging(false)}
      >
        <input {...getVideoInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium">
            {!videoFile ? 'Upload Video File' : 'Video Uploaded'}
          </p>
          <p className="text-sm text-muted-foreground">
            {!videoFile ? 'Drag and drop or click to select' : videoFile.name}
          </p>
          {videoFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVideoFile(null);
                setSrtFile(null);
                onFileSelect({ video: null });
              }}
              className="mt-2 text-sm text-destructive hover:text-destructive/80"
            >
              Remove Video
            </button>
          )}
        </div>
      </div>
    );
  };

  const SubtitleUpload = () => {
    const { getRootProps: getSrtRootProps, getInputProps: getSrtInputProps } = useDropzone({
      onDrop,
      accept: {
        'application/x-subrip': ['.srt'],
        'text/plain': ['.srt']
      },
      multiple: false,
      disabled: !videoFile
    });

    return (
      <div
        {...getSrtRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${!videoFile ? 'border-border bg-muted/50 cursor-not-allowed' :
            isDragging ? 'border-primary bg-secondary/50' : 'border-border hover:border-primary hover:bg-secondary/20 cursor-pointer'}`}
        onDragEnter={() => videoFile && setIsDragging(true)}
        onDragLeave={() => videoFile && setIsDragging(false)}
      >
        <input {...getSrtInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium">
            {!videoFile ? 'Upload Video First' : !srtFile ? 'Upload Subtitles (Optional)' : 'Subtitles Uploaded'}
          </p>
          <p className="text-sm text-muted-foreground">
            {!videoFile ? 'Video required for subtitle upload' :
              !srtFile ? 'Drag and drop or click to select .srt file' : srtFile.name}
          </p>
          {srtFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSrtFile(null);
                onFileSelect({ video: videoFile });
              }}
              className="mt-2 text-sm text-destructive hover:text-destructive/80"
            >
              Remove Subtitles
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 text-sm text-destructive p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video Upload */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Video Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload your video file to generate user stories
            </p>
          </div>
          <VideoUpload />
          {videoFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Video uploaded successfully</span>
            </div>
          )}
        </div>

        {/* Subtitles Upload */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Subtitles Upload</h3>
            <p className="text-sm text-muted-foreground">
              Optional: Add .srt subtitles for better context
            </p>
          </div>
          <SubtitleUpload />
          {videoFile && !srtFile && !isTranscribing && process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY && (
            <button
              onClick={handleTranscribe}
              className="w-full mt-4 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Generate Subtitles
            </button>
          )}
          {videoFile && !srtFile && !isTranscribing && !process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY && (
            <div className="mt-4 text-sm text-muted-foreground">
              Transcription requires a Deepgram API key. Please set the <code>NEXT_PUBLIC_DEEPGRAM_API_KEY</code> environment variable to enable this feature. You can still upload an SRT file.
            </div>
          )}
          {isTranscribing && process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Generating subtitles...</span>
            </div>
          )}
          {srtFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Subtitles uploaded successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="pt-6 border-t">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div className="space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Video: MP4, WebM, MOV</li>
              <li>Subtitles: SRT format only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
