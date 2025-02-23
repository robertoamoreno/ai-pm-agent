import * as parser from 'subtitles-parser';

export interface Subtitle {
  id: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

export function validateSRTWithVideo(subtitles: Subtitle[], videoDuration: number): boolean {
  if (!subtitles.length) return false;
  
  // Check if any subtitle extends beyond video duration
  const lastSubtitle = subtitles[subtitles.length - 1];
  if (lastSubtitle.endTime > videoDuration) {
    console.error('Subtitles extend beyond video duration');
    return false;
  }

  // Check for overlapping or out-of-order subtitles
  for (let i = 1; i < subtitles.length; i++) {
    if (subtitles[i].startTime < subtitles[i - 1].endTime) {
      console.error('Overlapping subtitles detected');
      return false;
    }
  }

  return true;
}

export function parseSRT(srtContent: string): Subtitle[] {
  if (!srtContent || typeof srtContent !== 'string') {
    throw new Error('Invalid SRT content: Content is empty or not a string');
  }

  try {
    // Parse SRT content using subtitles-parser
    const parsedSubtitles = parser.fromSrt(srtContent, true);
    
    // Convert to our Subtitle format
    return parsedSubtitles.map(sub => ({
      id: sub.id,
      startTime: sub.startTime / 1000, // Convert from ms to seconds
      endTime: sub.endTime / 1000,     // Convert from ms to seconds
      text: sub.text
    }));
  } catch (error) {
    console.error('Error parsing SRT content:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to parse SRT file');
  }
}

export function getSubtitlesForClip(subtitles: Subtitle[], startTime: number, endTime: number): string {
  return subtitles
    .filter(sub => 
      (sub.startTime >= startTime && sub.startTime <= endTime) ||
      (sub.endTime >= startTime && sub.endTime <= endTime) ||
      (sub.startTime <= startTime && sub.endTime >= endTime)
    )
    .map(sub => {
      const timeStart = formatTimestamp(sub.startTime);
      const timeEnd = formatTimestamp(sub.endTime);
      return `[${timeStart} -> ${timeEnd}]\n${sub.text}`;
    })
    .join('\n\n');
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word: string;
}

export interface DeepgramAlternative {
  transcript: string;
  words: DeepgramWord[];
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramTranscript {
  channels: DeepgramChannel[];
}

export function convertTranscriptToSrt(transcript: DeepgramTranscript): string {
  let srtContent = '';
  let index = 1;
  const words = transcript.channels[0].alternatives[0].words;

  // Group words into sentences (using punctuation as a boundary)
  let currentSentence: DeepgramWord[] = [];
  const sentences: DeepgramWord[][] = [];

  for (const word of words) {
    currentSentence.push(word);
    // Check if the word ends with punctuation
    if (word.punctuated_word.match(/[.!?]$/)) {
      sentences.push(currentSentence);
      currentSentence = [];
    }
  }

  // Add any remaining words as the last sentence
  if (currentSentence.length > 0) {
    sentences.push(currentSentence);
  }

  // Convert sentences to SRT format
  for (const sentence of sentences) {
    const startTime = formatTimestamp(sentence[0].start);
    const endTime = formatTimestamp(sentence[sentence.length - 1].end);
    const text = sentence.map((w) => w.punctuated_word).join(' ');

    srtContent += `${index}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${text.trim()}\n\n`;

    index++;
  }

  return srtContent.trim();
}
