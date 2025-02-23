export interface SceneInfo {
  frameData: string;
  timestamp: number;
}

export interface Story {
  id: string;
  content: string;
  scenes: SceneInfo[];
  notes: string;
  clipRange: {
    start: number;
    end: number;
  };
  timestamp: number;
}
