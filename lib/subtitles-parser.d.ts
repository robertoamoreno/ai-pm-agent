declare module 'subtitles-parser' {
  interface ParserSubtitle {
    id: number;
    startTime: number; // milliseconds
    endTime: number;   // milliseconds
    text: string;
  }

  export function fromSrt(srtContent: string, useMs?: boolean): ParserSubtitle[];
  export function toSrt(subtitles: ParserSubtitle[]): string;
}
