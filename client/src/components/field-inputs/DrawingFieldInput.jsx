import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const STROKE_COLORS = ['#1c1917', '#dc2626', '#2563eb', '#16a34a'];
const STROKE_WIDTHS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

// The drawing surface is deliberately bigger than the visible viewport, so
// zoom/pan have somewhere to go -- a small whiteboard rather than a single
// fixed page. Mouse wheel zooms (toward the cursor); click-drag pans the
// view when Edit is off, and draws when Edit is on.
const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 600;
const VIEWPORT_HEIGHT = 360;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;
const WHEEL_ZOOM_FACTOR = 1.1;
const BUTTON_ZOOM_FACTOR = 1.2;

const toolbarButtonClasses = (active) => `px-2 py-1 text-sm rounded-md border ${active
  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
  : 'border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'}`;

// value shape: { paths: CanvasPath[], svg: string } -- paths re-hydrate the
// canvas for continued editing, svg is what FieldRenderer displays elsewhere
// without needing to mount this component (see fieldConfigService.js /
// field-renderers/DrawingFieldRenderer.jsx for the server/render side).
export default function DrawingFieldInput({ value, onChange }) {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  const [isErasing, setIsErasing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  // Suppresses the onChange fire that loadPaths() itself triggers on mount,
  // so restoring a saved drawing doesn't immediately re-report it as a change.
  const hydratingRef = useRef(false);

  useEffect(() => {
    if (value?.paths?.length && canvasRef.current) {
      hydratingRef.current = true;
      canvasRef.current.loadPaths(value.paths);
    }
    // Only ever hydrate once, from the value this field mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCanvasChange = async (updatedPaths) => {
    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }
    const svg = updatedPaths.length ? await canvasRef.current.exportSvg() : '';
    onChange({ paths: updatedPaths, svg });
  };

  const toggleEraser = () => {
    const next = !isErasing;
    setIsErasing(next);
    canvasRef.current?.eraseMode(next);
  };

  // Keeps the content point under `center` (viewport-relative px) fixed on
  // screen while the zoom level changes, so scrolling over a spot zooms
  // toward it instead of toward the canvas's top-left corner.
  const zoomBy = useCallback((factor, center) => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom * factor));
      if (center && nextZoom !== prevZoom) {
        setPan((prevPan) => ({
          x: center.x - ((center.x - prevPan.x) / prevZoom) * nextZoom,
          y: center.y - ((center.y - prevPan.y) / prevZoom) * nextZoom,
        }));
      }
      return nextZoom;
    });
  }, []);

  const zoomAtViewportCenter = (factor) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    zoomBy(factor, rect ? { x: rect.width / 2, y: rect.height / 2 } : null);
  };

  // React's synthetic onWheel is passive by default, so preventDefault()
  // inside it is a silent no-op -- a real listener is needed to actually
  // stop the page from scrolling while zooming over the canvas.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return undefined;
    const handleWheel = (e) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [zoomBy]);

  const handleViewportMouseDown = (e) => {
    if (isEditMode) return;
    setIsDragging(true);
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  };

  // Pan tracking lives on window listeners (not the viewport element) so a
  // drag keeps working even if the pointer leaves the canvas mid-gesture.
  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMouseMove = (e) => {
      const { startX, startY, startPanX, startPanY } = dragStateRef.current;
      setPan({ x: startPanX + (e.clientX - startX), y: startPanY + (e.clientY - startY) });
    };
    const stopDragging = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [isDragging]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const viewportCursor = isEditMode
    ? (isErasing ? 'cell' : 'crosshair')
    : (isDragging ? 'grabbing' : 'grab');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setStrokeColor(color)}
              title={color}
              className={`h-6 w-6 rounded-full border-2 ${strokeColor === color ? 'border-brand-500' : 'border-stone-300 dark:border-stone-600'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="rounded-md border-stone-300 dark:border-stone-600 text-sm bg-white dark:bg-stone-700 text-stone-900 dark:text-white"
        >
          {STROKE_WIDTHS.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>

        <button type="button" onClick={toggleEraser} aria-pressed={isErasing} className={toolbarButtonClasses(isErasing)}>
          Eraser
        </button>

        <button
          type="button"
          onClick={() => setIsEditMode((prev) => !prev)}
          aria-pressed={isEditMode}
          title={isEditMode ? 'Click-drag draws. Click to switch to pan mode.' : 'Click-drag pans the view. Click to switch to draw mode.'}
          className={toolbarButtonClasses(isEditMode)}
        >
          {isEditMode ? 'Editing' : 'Panning'}
        </button>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => zoomAtViewportCenter(1 / BUTTON_ZOOM_FACTOR)} className={toolbarButtonClasses(false)} title="Zoom out">
            −
          </button>
          <span className="text-xs text-stone-500 dark:text-stone-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomAtViewportCenter(BUTTON_ZOOM_FACTOR)} className={toolbarButtonClasses(false)} title="Zoom in">
            +
          </button>
          <button type="button" onClick={resetView} className={toolbarButtonClasses(false)}>
            Reset View
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={() => canvasRef.current?.undo()} className={toolbarButtonClasses(false)}>
            Undo
          </button>
          <button type="button" onClick={() => canvasRef.current?.redo()} className={toolbarButtonClasses(false)}>
            Redo
          </button>
          <button
            type="button"
            onClick={() => canvasRef.current?.clearCanvas()}
            className="px-2 py-1 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onMouseDown={handleViewportMouseDown}
        className="rounded-md border border-stone-300 dark:border-stone-600 overflow-hidden bg-stone-100 dark:bg-stone-900"
        style={{ height: VIEWPORT_HEIGHT, cursor: viewportCursor }}
      >
        <div
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <ReactSketchCanvas
            ref={canvasRef}
            height={`${STAGE_HEIGHT}px`}
            width={`${STAGE_WIDTH}px`}
            canvasColor="white"
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            eraserWidth={strokeWidth * 3}
            readOnly={!isEditMode}
            onChange={handleCanvasChange}
          />
        </div>
      </div>
    </div>
  );
}
