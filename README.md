```
   _____ _   ______ _
  / ____| | / ____ | |
 | |  __| || (___  | |
 | | |_ | | \__  \ | |
 | |__| | |____) | | |___ 
  \_____|_______/  |_____|
                            
       G   L   S   L 

```

# GLSL Editor - Max Warren

A browser-based GLSL (OpenGL Shading Language) editor for writing, testing, recording, and exporting or loading vertex and fragment shaders, as well as standalone .html animations. Users can interactively build shaders and preview them in real time using WebGL.

[Go to App](https://max.wuaze.com/glsl)

---

## Purpose

While there are several WebGL, GLSL, and Three.js coding sandboxes available, i struggled to find audio-reactive capabilities within a web-based GLSL editor. It was also difficult to find existing tools that allow for clean WebGL animation exports in common video formats like MP4.

This application was developed to address those limitations. It provides a browser-based, open-source editor intended for users who need more control when creating audio-reactive visuals, without relying on proprietary software or paid platforms.

---

## Development

This application is built entirely with native PHP, HTML5, CSS, and JavaScript. It uses the WebGL API directly for rendering and shader compilation, without relying on any third-party libraries or frameworks. Aside from minimal server-side functionality for public posting and list retrieval via PHP endpoints, the entire application runs client-side.

---

## Features

- **Real-Time Shader Preview**: Visualize your GLSL code on a canvas as you write.  
- **Vertex & Fragment Shaders**: Edit vertex and fragment shaders in separate panels.  
- **File Support**: Load and edit `.vert`, `.frag`, `.vs`, `.fs`, and `.txt` files.  
- **Fullscreen Preview**: Toggle fullscreen mode for a larger preview area.  
- **Load & Export Options**: Load or export shaders as `.vert` or `.frag` files, or generate a full HTML file to run your shaders externally.  
- **Record WebM/MP4**: Record and preview your animation as a video file `.MP4` or `WEBM` with included audio with adjustable dimensions and quality.
- **Audio Reactive Support**: Make animations react to mic input, internal system audio, or uploaded audio files, with adjustable sensitivity levels.
- **Runtime Metrics**: Monitor WebGL canvas performance by tracking FPS, memory usage, GPU details, and draw calls.
- **Syntax Linting**: View and copy error messages for syntax issues in your shaders.  
- **Responsive Layout**: Adjustable editor layout with drag-and-drop resizing for the panels.
- **Generative Reports**: Generate visual flowcharts or reports (`json` or `txt`) for shader analysis.
- **Color Adjustment**: Use modal for slider based real-time color adjustment.
- **Theme Manager**: Customize editor colors with presets or individual variable selection.
- **Code Formatting**: Minify or format your code.

---

## Core Technologies

- **WebGL**: Used for rendering the shader preview on the canvas.
- **HTML5 & CSS3**: Structuring the user interface and ensuring responsiveness.
- **JavaScript**: Handling shader compilation, rendering logic, and file handling.
- **PHP**: File Saving/Auth for Public Posting.
---

## Browser Support

This application requires browsers that support:

- WebGL (for rendering)
- File API (for file upload)
- Fullscreen API (for fullscreen support)
- MediaRecorder API (for recording WebM/MP4 videos)
- Media Capture API (navigator.mediaDevices.getUserMedia) for microphone and internal audio input

---

## Inspirations

- https://glslsandbox.com/
- https://shadertoy.com/
- https://glsl.app/
- https://kaleidosync.com/
