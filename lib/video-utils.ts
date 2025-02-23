interface SceneInfo {
  frameData: string;
  timestamp: number;
}

function getPixelDifference(context: CanvasRenderingContext2D, width: number, height: number, prevImageData: ImageData | null): number {
  if (!prevImageData) return 100; // First frame is always different

  const currentImageData = context.getImageData(0, 0, width, height);
  const current = currentImageData.data;
  const previous = prevImageData.data;
  
  let diffCount = 0;
  const totalPixels = width * height;
  const threshold = 30; // RGB difference threshold

  // Sample every 4th pixel for performance
  for (let i = 0; i < current.length; i += 16) {
    const rDiff = Math.abs(current[i] - previous[i]);
    const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
    const bDiff = Math.abs(current[i + 2] - previous[i + 2]);

    if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
      diffCount++;
    }
  }

  // Return percentage of pixels that changed
  return (diffCount / (totalPixels / 4)) * 100;
}

export async function detectSceneChanges(
  videoFile: File,
  sensitivityThreshold: number = 5, // Percentage of pixels that need to change
  startTime: number = 0,
  endTime?: number
): Promise<SceneInfo[]> {
  const sceneChanges: SceneInfo[] = [];
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const duration = endTime ? Math.min(endTime, video.duration) : video.duration;
      const frameInterval = 0.1; // Check every 100ms
      let currentTime = startTime;
      let prevImageData: ImageData | null = null;

      video.onseeked = () => {
        if (currentTime <= duration) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const difference = getPixelDifference(context, canvas.width, canvas.height, prevImageData);
          
          if (difference > sensitivityThreshold) {
            sceneChanges.push({
              timestamp: currentTime,
              frameData: canvas.toDataURL('image/jpeg', 0.8)
            });
          }

          prevImageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          currentTime += frameInterval;
          if (currentTime <= duration) {
            video.currentTime = currentTime;
          } else {
            resolve(sceneChanges);
          }
        } else {
          resolve(sceneChanges);
        }
      };

      video.currentTime = startTime;
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(videoFile);
  });
}

export async function extractFrames(
  videoFile: File,
  startTime: number,
  endTime: number,
  intervalSeconds: number = 5
): Promise<SceneInfo[]> {
  const frames: SceneInfo[] = [];
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = endTime - startTime;
      const totalFrames = Math.floor(duration / intervalSeconds);
      
      let currentFrame = 0;

      video.onseeked = () => {
        if (currentFrame <= totalFrames) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const currentTime = startTime + (currentFrame * intervalSeconds);
          frames.push({
            timestamp: currentTime,
            frameData: canvas.toDataURL('image/jpeg', 0.8)
          });
          
          currentFrame++;
          if (currentFrame <= totalFrames) {
            video.currentTime = startTime + (currentFrame * intervalSeconds);
          } else {
            // Add the last frame if we haven't reached it exactly
            if (video.currentTime < endTime) {
              video.currentTime = endTime;
            } else {
              resolve(frames);
            }
          }
        } else {
          resolve(frames);
        }
      };

      video.currentTime = startTime;
    };

    video.onerror = reject;
    video.src = URL.createObjectURL(videoFile);
  });
}
