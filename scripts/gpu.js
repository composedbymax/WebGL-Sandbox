(function() {
    'use strict';
    let isWebGPUMode = false;
    let webgpuDevice = null;
    let webgpuContext = null;
    let webgpuPipeline = null;
    let webgpuBindGroup = null;
    let webgpuUniformBuffer = null;
    let webgpuVertexBuffer = null;
    let webgpuAnimationId = null;
    let webglAnimationId = null;
    let webgpuCanvas = null;
    let originalCanvas = null;
    let resizeObserver = null;
    let originalVertexCode = null;
    let originalFragmentCode = null;
    const createWebGPUToggle = () => {
        const toggleBtn = Object.assign(document.createElement('button'), {
            id: 'webgpuToggle',
            className: 'lbtn webgpu-toggle',
            textContent: 'WEBGPU',
            title: 'Toggle between WebGL and WebGPU rendering',
        });
        document.body.appendChild(toggleBtn);
        return toggleBtn;
    };
    const style = document.createElement('style');
    style.textContent = `
        .webgpu-toggle {
            font-style: inherit;
            all: unset;
            position: fixed;
            bottom: 10px;
            right: 146px;
            z-index: 9999;
            background-color: var(--d);
            color: var(--7);
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            border: none;
            display: inline-block;
            height:23px;
            width: auto;
        }
        .webgpu-toggle:hover {
            background-color: var(--5);
        }
        .editor-panel .panel-header span {
            font-weight: bold;
        }
        #webgpu-canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
    `;
    document.head.appendChild(style);
    const storeOriginalCode = () => {
        const vertCode = document.getElementById('vertCode');
        const fragCode = document.getElementById('fragCode');
        if (vertCode && fragCode && originalVertexCode === null && originalFragmentCode === null) {
            originalVertexCode = vertCode.value;
            originalFragmentCode = fragCode.value;
        }
    };
    const updateShaderEditors = (isWebGPU) => {
        const vertCode = document.getElementById('vertCode');
        const fragCode = document.getElementById('fragCode');
        const vertPanel = document.getElementById('vertPanel');
        const fragPanel = document.getElementById('fragPanel');
        if (isWebGPU) {
            storeOriginalCode();
            if (vertPanel && vertPanel.querySelector('.panel-header span')) {
                vertPanel.querySelector('.panel-header span').textContent = 'Vertex Shader (WGSL)';
            }
            if (fragPanel && fragPanel.querySelector('.panel-header span')) {
                fragPanel.querySelector('.panel-header span').textContent = 'Fragment Shader (WGSL)';
            }
            const vertFile = document.getElementById('vertFile');
            const fragFile = document.getElementById('fragFile');
            if (vertFile) vertFile.accept = '.wgsl,.txt';
            if (fragFile) fragFile.accept = '.wgsl,.txt';
            if (vertCode) {
                vertCode.value = `// WebGPU Vertex Shader (WGSL)
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}
@vertex
fn vs_main(@location(0) position: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(position, 0.0, 1.0);
    output.uv = position * 0.5 + 0.5;
    return output;
}`;
            }
            if (fragCode) {
                fragCode.value = `// WebGPU Fragment Shader (WGSL) - Created By: Max Warren
struct Uniforms {
    resolution: vec2<f32>,
    time: f32,
    mouse_x: f32,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@fragment  
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let fragCoord = uv * uniforms.resolution;
    let r = sin(uniforms.time * 2.0 + fragCoord.x * 0.01) * 0.5 + 0.5;
    let g = sin(uniforms.time * 1.5 + fragCoord.y * 0.01) * 0.5 + 0.5;
    let b = sin(uniforms.time * 3.0 + (fragCoord.x + fragCoord.y) * 0.005) * 0.5 + 0.5;
    return vec4<f32>(r, g, b, 1.0);
}`;
            }
        } else {
            if (vertPanel && vertPanel.querySelector('.panel-header span')) {
                vertPanel.querySelector('.panel-header span').textContent = 'Vertex Shader';
            }
            if (fragPanel && fragPanel.querySelector('.panel-header span')) {
                fragPanel.querySelector('.panel-header span').textContent = 'Fragment Shader';
            }
            const vertFile = document.getElementById('vertFile');
            const fragFile = document.getElementById('fragFile');
            if (vertFile) vertFile.accept = '.vert,.vs,.txt';
            if (fragFile) fragFile.accept = '.frag,.fs,.txt';
            if (vertCode && originalVertexCode !== null) {vertCode.value = originalVertexCode;}
            if (fragCode && originalFragmentCode !== null) {fragCode.value = originalFragmentCode;}
        }
    };
    const setupCanvasResizing = () => {
        if (!webgpuCanvas) return;
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        const updateCanvasSize = () => {
            if (!webgpuCanvas || !webgpuContext) return;
            const container = webgpuCanvas.parentElement;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const newWidth = Math.floor(containerRect.width);
            const newHeight = Math.floor(containerRect.height);
            if (webgpuCanvas.width !== newWidth || webgpuCanvas.height !== newHeight) {
                webgpuCanvas.width = newWidth;
                webgpuCanvas.height = newHeight;
                if (isWebGPUMode && webgpuPipeline) {
                    const startTime = performance.now() - (window.startTime || 0);
                    const time = startTime * 0.001;
                    renderWebGPU(time);
                }
            }
        };
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    updateCanvasSize();
                }
            });
            resizeObserver.observe(webgpuCanvas.parentElement);
        } else {
            window.addEventListener('resize', updateCanvasSize);
        }
        updateCanvasSize();
    };
    const initWebGPU = async () => {
        if (!navigator.gpu) {
            console.error('WebGPU not supported');
            return false;
        }
        try {
            const adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });
            if (!adapter) {
                console.error('No WebGPU adapter found');
                return false;
            }
            webgpuDevice = await adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {}
            });
            originalCanvas = document.getElementById('glcanvas');
            webgpuCanvas = document.createElement('canvas');
            webgpuCanvas.id = 'webgpu-canvas';
            webgpuCanvas.style.cssText = originalCanvas.style.cssText;
            webgpuCanvas.className = originalCanvas.className;
            originalCanvas.style.display = 'none';
            originalCanvas.parentNode.insertBefore(webgpuCanvas, originalCanvas);
            webgpuContext = webgpuCanvas.getContext('webgpu');
            if (!webgpuContext) {
                console.error('Could not get WebGPU context');
                return false;
            }
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            webgpuContext.configure({
                device: webgpuDevice,
                format: canvasFormat,
                alphaMode: 'premultiplied',
            });
            setupCanvasResizing();
            return true;
        } catch (error) {
            console.error('WebGPU initialization failed:', error);
            console.error('Error details:', error.stack);
            return false;
        }
    };
    const createWebGPUPipeline = (vertexShader, fragmentShader) => {
        try {
            [webgpuPipeline, webgpuBindGroup] = [null, null];
            [webgpuUniformBuffer, webgpuVertexBuffer].forEach(buf => {
                if (buf) buf.destroy?.();
            });
            webgpuUniformBuffer = webgpuVertexBuffer = null;
            webgpuUniformBuffer = webgpuDevice.createBuffer({
                size: 16,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
            webgpuVertexBuffer = webgpuDevice.createBuffer({
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            webgpuDevice.queue.writeBuffer(webgpuVertexBuffer, 0, vertices);
            const bindGroupLayout = webgpuDevice.createBindGroupLayout({
                entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }]
            });
            const pipelineLayout = webgpuDevice.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
            webgpuPipeline = webgpuDevice.createRenderPipeline({
                layout: pipelineLayout,
                vertex: {
                    module: webgpuDevice.createShaderModule({ code: vertexShader }),
                    entryPoint: 'vs_main',
                    buffers: [{
                        arrayStride: 8,
                        attributes: [{ format: 'float32x2', offset: 0, shaderLocation: 0 }]
                    }]
                },
                fragment: {
                    module: webgpuDevice.createShaderModule({ code: fragmentShader }),
                    entryPoint: 'fs_main',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'triangle-list' }
            });
            webgpuBindGroup = webgpuDevice.createBindGroup({
                layout: bindGroupLayout,
                entries: [{ binding: 0, resource: { buffer: webgpuUniformBuffer } }]
            });
            return true;
        } catch (error) {
            console.error('WebGPU pipeline creation failed:', error);
            showWebGPUError(error.message);
            return false;
        }
    };
    const renderWebGPU = (time) => {
        if (!webgpuPipeline || !webgpuContext || !webgpuDevice || !webgpuCanvas) return;
        const mouse = window.mouse || { x: 0, y: 0 };
        const uniformData = new Float32Array([
            webgpuCanvas.width, webgpuCanvas.height,
            time,
            mouse.x / webgpuCanvas.width,
        ]);
        webgpuDevice.queue.writeBuffer(webgpuUniformBuffer, 0, uniformData);
        const commandEncoder = webgpuDevice.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: webgpuContext.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store',
            }]
        });
        renderPass.setPipeline(webgpuPipeline);
        renderPass.setBindGroup(0, webgpuBindGroup);
        renderPass.setVertexBuffer(0, webgpuVertexBuffer);
        renderPass.draw(6);
        renderPass.end();
        webgpuDevice.queue.submit([commandEncoder.finish()]);
    };
    const webgpuRenderLoop = () => {
        if (!isWebGPUMode) return;
        const startTime = performance.now() - (window.startTime || 0);
        const time = startTime * 0.001;
        renderWebGPU(time);
        webgpuAnimationId = requestAnimationFrame(webgpuRenderLoop);
    };
    const showWebGPUError = (errorText) => {
        const lintDiv = document.getElementById('lint');
        const lintContent = document.getElementById('lintContent');
        const copyBtn = document.getElementById('copyErrorsBtn');
        const closeBtn = document.getElementById('closeLintBtn');
        if (lintContent) lintContent.textContent = 'WebGPU Error: ' + errorText;
        if (copyBtn) copyBtn.style.display = 'block';
        if (closeBtn) closeBtn.style.display = 'block';
        if (lintDiv) lintDiv.style.display = 'block';
    };
    let originalRebuildProgram = null;
    let originalRender = null;
    const rebuildWebGPUProgram = () => {
        const vertCode = document.getElementById('vertCode');
        const fragCode = document.getElementById('fragCode');
        if (!vertCode || !fragCode) return;
        const lintDiv = document.getElementById('lint');
        const copyBtn = document.getElementById('copyErrorsBtn');
        const closeBtn = document.getElementById('closeLintBtn');
        if (lintDiv) lintDiv.style.display = 'none';
        if (copyBtn) copyBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';
        const success = createWebGPUPipeline(vertCode.value, fragCode.value);
    };
    const setupWebGPUMouseEvents = () => {
        if (!webgpuCanvas) return;
        const getPos = (e, isTouch = false) => {
            const rect = webgpuCanvas.getBoundingClientRect();
            const point = isTouch ? (e.touches[0] || e.changedTouches[0]) : e;
            return {
                x: point.clientX - rect.left,
                y: rect.height - (point.clientY - rect.top),
            };
        };
        const updateMouse = (e, isTouch = false, type) => {
            const pos = getPos(e, isTouch);
            let mouse = window.mouse || { x: 0, y: 0, clickX: 0, clickY: 0, isPressed: false, lastClickTime: 0 };
            if (type === 'move') {
                mouse.x = pos.x;
                mouse.y = pos.y;
            } else if (type === 'down') {
                mouse.isPressed = true;
                mouse.clickX = pos.x;
                mouse.clickY = pos.y;
                mouse.lastClickTime = performance.now();
            } else if (type === 'up') {
                mouse.isPressed = false;
            }
            window.mouse = mouse;
            if (isTouch) e.preventDefault();
        };
        const events = ['mousemove', 'mousedown', 'mouseup', 'mouseleave', 'touchmove', 'touchstart', 'touchend'];
        events.forEach(event => {
            webgpuCanvas.removeEventListener(event, () => {});
        });
        webgpuCanvas.addEventListener('mousemove', e => updateMouse(e, false, 'move'));
        webgpuCanvas.addEventListener('mousedown', e => updateMouse(e, false, 'down'));
        webgpuCanvas.addEventListener('mouseup', e => updateMouse(e, false, 'up'));
        webgpuCanvas.addEventListener('mouseleave', () => { 
            if (window.mouse) window.mouse.isPressed = false; 
        });
        webgpuCanvas.addEventListener('touchmove', e => updateMouse(e, true, 'move'), { passive: false });
        webgpuCanvas.addEventListener('touchstart', e => updateMouse(e, true, 'down'), { passive: false });
        webgpuCanvas.addEventListener('touchend', e => updateMouse(e, true, 'up'), { passive: false });
    };
    const toggleWebGPU = async () => {
        const toggleBtn = document.getElementById('webgpuToggle');
        const setToggleState = (text, color) => {
            toggleBtn.textContent = text;
            toggleBtn.style.backgroundColor = color;
        };
        const cleanupAnimation = () => {
            [webglAnimationId, window.animationId, webgpuAnimationId].forEach(id => {
                if (id) cancelAnimationFrame(id);
            });
            webglAnimationId = window.animationId = webgpuAnimationId = null;
        };
        const destroyBuffer = (bufferVar) => {
            if (bufferVar) bufferVar.destroy();
            return null;
        };
        if (!isWebGPUMode) {
            if (!originalRebuildProgram && window.rebuildProgram) originalRebuildProgram = window.rebuildProgram;
            if (!originalRender && window.render) originalRender = window.render;
            cleanupAnimation();
            if (await initWebGPU()) {
                isWebGPUMode = true;
                setToggleState('GLSL', 'var(--r)');
                updateShaderEditors(true);
                Object.assign(window, {
                    rebuildProgram: rebuildWebGPUProgram,
                    render: webgpuRenderLoop
                });
                setupWebGPUMouseEvents();
                setTimeout(() => {
                    rebuildWebGPUProgram();
                    webgpuRenderLoop();
                }, 100);
            } else {
                console.error('Failed to initialize WebGPU');
                alert('WebGPU initialization failed. Check the console for details.');
            }
        } else {
            cleanupAnimation();
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
            webgpuVertexBuffer = destroyBuffer(webgpuVertexBuffer);
            webgpuUniformBuffer = destroyBuffer(webgpuUniformBuffer);
            if (webgpuDevice) {
                webgpuDevice.destroy();
                webgpuDevice = null;
            }
            [webgpuContext, webgpuPipeline, webgpuBindGroup] = [null, null, null];
            if (webgpuCanvas && originalCanvas) {
                webgpuCanvas.remove();
                originalCanvas.style.display = 'block';
                webgpuCanvas = null;
            }
            isWebGPUMode = false;
            setToggleState('WebGPU', 'var(--d)');
            updateShaderEditors(false);
            if (originalRebuildProgram) window.rebuildProgram = originalRebuildProgram;
            if (originalRender) window.render = originalRender;
            const canvas = document.getElementById('glcanvas');
            if (canvas) {
                window.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (!window.gl) console.warn('WebGL2 not available, falling back to WebGL1.');
            }
            setTimeout(() => {
                window.rebuildProgram?.();
                window.render?.();
            }, 100);
        }
    };
    const init = () => {
        const toggleBtn = createWebGPUToggle();
        if (toggleBtn) {toggleBtn.addEventListener('click', toggleWebGPU);}
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }
})();