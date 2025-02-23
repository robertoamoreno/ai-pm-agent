# PM AI Agent 🤖

A sophisticated Next.js application that transforms  video demonstrations into detailed user stories using AI. This tool helps Product Managers streamline their documentation process by automatically generating structured user stories from video content. The project was primarily developed (95%) by Cline AI, with only the initial scaffolding done manually.

## Features

### 1. Video Processing
- Upload video files with optional SRT subtitles
- Built-in video player with frame selection capabilities
   - Automatic subtitle parsing and integration

### 2. AI-Powered Story Generation
- Utilizes Google's Gemini 1.5/2.0 Pro AI model
- Analyzes video frames and subtitles to understand feature demonstrations
- Generates comprehensive user stories in standard Agile format
- Includes technical considerations and story points

### 3. Story Management & Integration
- Save and manage multiple user stories
- Delete unwanted stories
- Organized timeline view of generated content
- Export stories to ClickUp with screenshots
- Track export progress with visual indicators

### 4. ClickUp Integration
- Configure ClickUp API token in Integrations page
- Export user stories directly to ClickUp spaces and lists
- Automatic status handling using list defaults
- Markdown-formatted story content
- Scene screenshots uploaded as attachments
- Progress tracking for multi-image uploads

## Integrations

### ClickUp Integration
1. **Configuration**
   - Navigate to the Integrations page
   - Add your ClickUp API token
   - Token is securely stored and validated

2. **Export Features**
   - Export stories directly to ClickUp
   - Select target space and list
   - Automatic status assignment
   - Scene screenshots included as attachments
   - Progress tracking for uploads

3. **Task Format**
   - Structured user story content
   - Markdown formatting for readability
   - Metadata section with clip details
   - Notes section (if available)
   - Scene screenshots as visual context

## How It Works

1. **Upload Phase**
   - Download your Loom video or any other video demonstration with SRT subtitles
   - Upload the video and SRT file to the application
   - Automatic subtitle parsing and synchronization

2. **Clip Selection**
   - Use the built-in video player to select relevant clips
   - Add context notes for better AI understanding
   - Frame-by-frame selection for precise feature demonstration capture

3. **Story Generation**
   - AI analyzes selected video frames
   - Processes any available subtitles/dialogue
   - Generates structured user stories including:
     - User story title
     - User/Action/Benefit format
     - Acceptance criteria
     - Technical notes
     - Story point estimation

## Technical Stack

- **Framework**: Next.js 15.1.3 with TypeScript
- **UI**: TailwindCSS with custom components
- **AI Integration**: 
  - Google Generative AI (Gemini 1.5 Pro)
- **Transcription**: Deepgram API (optional)
- **Subtitle Processing**: Subtitle parser for SRT files
- **File Handling**: React Dropzone

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   # AI Services
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

   # Transcription Service (Optional)
   NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key

   # ClickUp Integration (Optional)
   # Configure through the Integrations page in the app
   # The token will be stored securely in the environment
   # CLICKUP_TOKEN=your_clickup_api_token
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Start the Application**
   - Navigate to the application in your browser
   - You'll see the main interface with a file upload section

2. **Upload Content**
   - Record your feature demonstration using tool like Loom
   - Download both the video file and SRT subtitles from Loom
   - For subtitles, you can either:
     * Download SRT subtitles from Loom and upload them directly
     * Use the built-in transcription feature (requires Deepgram API key)
   - Drag and drop or select the files in the application
   - The video player will automatically load with synchronized subtitles

3. **Select Clips**
   - Use the video player controls to navigate
   - Select key frames that demonstrate the feature
   - Add context notes to guide the AI

4. **Generate Stories**
   - Click generate to create the user story
   - Review the generated content
   - Save or modify as needed

5. **Export to ClickUp** (Optional)
   - Configure ClickUp integration in the Integrations page
   - Click the export icon on any generated story
   - Select the target space and list
   - Wait for the export to complete, including:
     * Story content with markdown formatting
     * Scene screenshots as attachments
     * Metadata and notes

## Best Practices

- Use clear, well-lit video demonstrations
- Include relevant subtitles for better context
- Select frames that clearly show feature transitions
- Provide detailed context notes for better AI understanding
- Review and edit generated stories as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

Copyright (c) 2024 PM AI Agent Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
