import { NextRequest, NextResponse } from 'next/server';
import { createClient, DeepgramError } from '@deepgram/sdk';
import {
  convertTranscriptToSrt,
  DeepgramTranscript,
  DeepgramAlternative,
  DeepgramWord,
} from '@/lib/srt-utils';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'DEEPGRAM_API_KEY is not set. Please set it in your environment variables. Transcription is unavailable.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('video') as Blob | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert Blob to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        smart_format: true,
        language: 'en-US',
      }
    );
    console.log('Deepgram response:', response);

    if (
      !response ||
      !response.result ||
      !response.result.results ||
      !response.result.results.channels?.[0]?.alternatives?.[0]?.words?.length
    ) {
      throw new Error('Failed to transcribe file');
    }

    const transcript: DeepgramTranscript = {
      channels: response.result.results.channels.map(
        (channel: { alternatives: DeepgramAlternative[] }) => ({
          alternatives: channel.alternatives.map(
            (alternative: DeepgramAlternative) => ({
              transcript: alternative.transcript,
              words: alternative.words.map((word: DeepgramWord) => ({
                word: word.word,
                start: word.start,
                end: word.end,
                confidence: word.confidence,
                punctuated_word: word.punctuated_word,
              })),
            })
          ),
        })
      ),
    };

    const srtContent = convertTranscriptToSrt(transcript);

    return new NextResponse(srtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="transcript.srt"',
      },
    });
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    const errorMessage = error instanceof DeepgramError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'An unknown error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
