import React, { useState, useRef, useEffect } from 'react';
import type { InstagramMediaItem, ExtractedFrame } from '../types';
import { 
  X, 
  Camera, 
  Download, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Upload, 
  Play, 
  Pause, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  extractAutoFramesFromVideo, 
  captureFrameFromVideoElement, 
  formatVideoTime 
} from '../utils/videoFrameExtractor';
import { useApp } from '../context/AppContext';

interface VideoFrameExtractorModalProps {
  mediaItem: InstagramMediaItem | null;
  onClose: () => void;
}

export const VideoFrameExtractorModal: React.FC<VideoFrameExtractorModalProps> = ({
  mediaItem,
  onClose
}) => {
  const { addExtractedFramesToMediaLibrary, updateInstagramMedia } = useApp();

  const [activeVideoSrc, setActiveVideoSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [corsWarning, setCorsWarning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mediaItem) {
      setActiveVideoSrc(mediaItem.mediaUrl);
      setExtractedFrames(mediaItem.extractedFrames || []);
      setSelectedFrameIds(new Set());
      setCorsWarning(false);
      setSuccessMsg('');
    }
  }, [mediaItem]);

  if (!mediaItem) return null;

  // Handle Video Metadata Loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // 1. Manual Capture of Current Frame
  const handleCaptureCurrent = () => {
    if (!videoRef.current) return;
    try {
      const frame = captureFrameFromVideoElement(videoRef.current, mediaItem.id, format, 0.95);
      setExtractedFrames(prev => [frame, ...prev]);
      setSelectedFrameIds(prev => new Set(prev).add(frame.id));
      setSuccessMsg(`Captured frame at ${frame.formattedTimestamp}`);
    } catch (err: any) {
      console.warn('Canvas capture error:', err);
      setCorsWarning(true);
    }
  };

  // 2. Automatic 5-Point Frame Extraction
  const handleAutoExtract = async () => {
    setIsExtracting(true);
    setCorsWarning(false);
    setSuccessMsg('');

    try {
      const frames = await extractAutoFramesFromVideo(
        activeVideoSrc,
        mediaItem.id,
        format,
        (p) => setExtractStatus(`${p.status} (${p.percentage}%)`)
      );

      setExtractedFrames(prev => [...frames, ...prev]);
      // Select newly extracted by default
      const newIds = new Set(selectedFrameIds);
      frames.forEach(f => newIds.add(f.id));
      setSelectedFrameIds(newIds);

      setSuccessMsg(`Successfully extracted ${frames.length} high-resolution frames!`);
    } catch (err: any) {
      console.warn('Auto extraction error:', err);
      setCorsWarning(true);
    } finally {
      setIsExtracting(false);
      setExtractStatus('');
    }
  };

  // 3. Handle Local Original Video Upload
  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setActiveVideoSrc(url);
    setCorsWarning(false);
    setSuccessMsg(`Loaded raw file "${file.name}" for instant local extraction.`);
  };

  // Toggle Frame Selection
  const toggleFrameSelect = (id: string) => {
    setSelectedFrameIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFrames = () => {
    if (selectedFrameIds.size === extractedFrames.length) {
      setSelectedFrameIds(new Set());
    } else {
      setSelectedFrameIds(new Set(extractedFrames.map(f => f.id)));
    }
  };

  // Download a single frame
  const downloadFrame = (frame: ExtractedFrame) => {
    const a = document.createElement('a');
    a.href = frame.dataUrl;
    a.download = `roa-frame-${mediaItem.id}-${frame.formattedTimestamp.replace(/[:.]/g, '-')}.${format === 'image/webp' ? 'webp' : 'jpg'}`;
    a.click();
  };

  // Download all selected frames
  const downloadSelected = () => {
    const selected = extractedFrames.filter(f => selectedFrameIds.has(f.id));
    selected.forEach((f, idx) => {
      setTimeout(() => downloadFrame(f), idx * 250);
    });
  };

  // Save selected frames to Website Media Library
  const saveSelectedToLibrary = () => {
    const selected = extractedFrames.filter(f => selectedFrameIds.has(f.id));
    if (selected.length === 0) return;

    addExtractedFramesToMediaLibrary(selected, mediaItem);
    setSuccessMsg(`Saved ${selected.length} image(s) to the Website Media Library! (Draft status ready for review)`);
  };

  // Set selected frame as video thumbnail
  const setAsThumbnail = (frame: ExtractedFrame) => {
    updateInstagramMedia(mediaItem.id, {
      thumbnailUrl: frame.dataUrl
    });
    setSuccessMsg(`Updated video custom thumbnail to frame at ${frame.formattedTimestamp}!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E8E2D5] bg-[#FAF8F5]/90 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EBF0E9] text-[#455240] flex items-center justify-center border border-[#455240]/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1C1B1A]">
                Video Frame Extraction Studio
              </h2>
              <span className="text-xs text-[#8C857B]">
                Extract original resolution photographs from Instagram Reel
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#595550] hover:text-[#1C1B1A] hover:bg-white border border-transparent hover:border-[#E8E2D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Studio Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Video & Timeline Player */}
          <div className="bg-[#1C1B1A] rounded-2xl overflow-hidden border border-[#363330] p-4 text-white space-y-4">
            
            <div className="relative max-h-72 flex items-center justify-center bg-black/50 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                src={activeVideoSrc}
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                className="max-h-72 w-auto object-contain mx-auto"
              />

              {/* Play / Pause Overlay Button */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-all backdrop-blur-sm"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#B4ADA2]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B88B4A]" />
                  <span>Current: <strong>{formatVideoTime(currentTime)}</strong></span>
                </div>
                <span>Total: {formatVideoTime(duration)}</span>
              </div>

              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.05}
                value={currentTime}
                onChange={handleScrub}
                className="w-full h-2 bg-[#363330] rounded-lg appearance-none cursor-pointer accent-[#B88B4A]"
              />
            </div>

            {/* Video Controls Action Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#363330]">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCaptureCurrent}
                  className="inline-flex items-center gap-1.5 bg-[#FAF8F5] text-[#1C1B1A] hover:bg-[#E8E2D5] px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#455240]" />
                  <span>Capture This Exact Frame</span>
                </button>

                <button
                  onClick={handleAutoExtract}
                  disabled={isExtracting}
                  className="inline-flex items-center gap-1.5 bg-[#455240] hover:bg-[#2E372B] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtracting ? extractStatus : 'Auto-Extract 5 Key Frames'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {/* Format selection: JPG / WebP */}
                <div className="flex items-center gap-1.5 bg-[#2A2826] px-2.5 py-1 rounded-xl border border-[#363330]">
                  <span className="text-[#B4ADA2]">Format:</span>
                  <button
                    onClick={() => setFormat('image/jpeg')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      format === 'image/jpeg' ? 'bg-[#FAF8F5] text-[#1C1B1A]' : 'text-[#B4ADA2]'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => setFormat('image/webp')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      format === 'image/webp' ? 'bg-[#FAF8F5] text-[#1C1B1A]' : 'text-[#B4ADA2]'
                    }`}
                  >
                    WebP
                  </button>
                </div>

                {/* Upload original raw video if CDN blocks CORS */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleLocalVideoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#B88B4A] hover:underline flex items-center gap-1"
                  title="Upload original video file from your phone or PC for 100% unrestricted extraction"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load Original Video</span>
                </button>
              </div>

            </div>

          </div>

          {/* CORS / Access Warning with Solution */}
          {corsWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong>Instagram CDN Cross-Origin Restriction:</strong>
                <p>
                  Meta's remote CDN occasionally restricts direct canvas extraction on external domains.
                  You can click <strong>"Load Original Video"</strong> above to select the video file directly from your device, and extract crystal-clear 1080p/4K frames locally without any restriction!
                </p>
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-900 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Extracted Frames Gallery */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D5] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
                  Extracted Image Frames ({extractedFrames.length})
                </h3>
                <span className="text-xs text-[#8C857B]">
                  Select frames to download or save as standalone photographs in your website library.
                </span>
              </div>

              {extractedFrames.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllFrames}
                    className="px-3 py-1.5 rounded-lg border border-[#E8E2D5] text-xs font-semibold text-[#595550] hover:bg-white"
                  >
                    {selectedFrameIds.size === extractedFrames.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <button
                    onClick={downloadSelected}
                    disabled={selectedFrameIds.size === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D5] text-xs font-semibold text-[#1C1B1A] hover:bg-[#FAF8F5] disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ({selectedFrameIds.size})</span>
                  </button>

                  <button
                    onClick={saveSelectedToLibrary}
                    disabled={selectedFrameIds.size === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-[#455240] transition-colors disabled:opacity-40 shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Save to Media Library</span>
                  </button>
                </div>
              )}
            </div>

            {extractedFrames.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {extractedFrames.map((frame) => {
                  const isSelected = selectedFrameIds.has(frame.id);
                  return (
                    <div
                      key={frame.id}
                      className={`paper-card rounded-xl overflow-hidden border transition-all ${
                        isSelected 
                          ? 'ring-2 ring-[#455240] border-[#455240]' 
                          : 'border-[#E8E2D5]'
                      }`}
                    >
                      <div className="relative h-44 bg-[#1C1B1A] group">
                        <img
                          src={frame.dataUrl}
                          alt={`Extracted at ${frame.formattedTimestamp}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Selection Checkbox */}
                        <button
                          onClick={() => toggleFrameSelect(frame.id)}
                          className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-colors shadow-sm ${
                            isSelected ? 'bg-[#455240] text-white' : 'bg-white/80 text-transparent hover:text-gray-400'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Timestamp Pill */}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                          {frame.formattedTimestamp}
                        </div>

                        {/* Quick Action Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            onClick={() => downloadFrame(frame)}
                            className="p-2 rounded-lg bg-white text-[#1C1B1A] hover:bg-[#E8E2D5] transition-colors shadow"
                            title="Download Frame"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAsThumbnail(frame)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#455240] text-white text-[11px] font-semibold hover:bg-[#2E372B] transition-colors shadow"
                            title="Use as Video Thumbnail"
                          >
                            Set Thumbnail
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white text-[11px] text-[#595550] flex items-center justify-between">
                        <span>{frame.width}×{frame.height}</span>
                        <span className="uppercase text-[9px] font-semibold text-[#8D5B4C]">
                          {frame.format.split('/')[1]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#E8E2D5] text-xs text-[#8C857B] space-y-2">
                <Camera className="w-8 h-8 text-[#8C857B] mx-auto opacity-50" />
                <p>No frames extracted yet.</p>
                <p className="text-[11px]">
                  Use the timeline scrubber above and click <strong>"Capture This Exact Frame"</strong> or click <strong>"Auto-Extract 5 Key Frames"</strong>.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8E2D5] flex items-center justify-between">
          <span className="text-xs text-[#8C857B]">
            All extracted frames preserve native aspect ratios and resolution without distortion.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-[#455240] transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
