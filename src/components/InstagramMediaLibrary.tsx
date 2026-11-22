import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type {
  InstagramMediaItem,
  MediaCategory
} from '../types';
import {
  RefreshCw,
  ExternalLink,
  Trash2,
  Check,
  Plus,
  Eye,
  EyeOff,
  Camera,
  Play,
  Layers,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { VideoFrameExtractorModal } from './VideoFrameExtractorModal';
import {
  SAMPLE_INSTAGRAM_POSTS
} from '../services/instagramService';
import { safeExternalHref } from '../utils/url';

const CATEGORIES: MediaCategory[] = [
  'Meetups',
  'Community Moments',
  'Reels',
  'Announcements',
  'Behind the Scenes',
  'Other'
];

export const InstagramMediaLibrary: React.FC = () => {
  const {
    instagramConfig,
    instagramMedia,
    importInstagramMedia,
    deleteInstagramMedia,
    updateInstagramMedia,
    togglePublishInstagramMedia,
    assignMediaToTarget,
    meetups,
    articles
  } = useApp();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modals & Tools
  const [activeExtractorMedia, setActiveExtractorMedia] = useState<InstagramMediaItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<InstagramMediaItem | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Manual Upload Ref
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Filtered media
  const filteredMedia = instagramMedia.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesType = selectedType === 'All' || item.mediaType === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesCat && matchesType && matchesStatus;
  });

  // Load bundled sample content. Live Instagram sync requires a trusted server integration.
  const handleLoadSampleMedia = async () => {
    setIsSyncing(true);
    setStatusMsg(null);

    try {
      const { added, skippedDuplicates } = importInstagramMedia(SAMPLE_INSTAGRAM_POSTS);

      setStatusMsg({
        text: `Sample media loaded: ${added} added, ${skippedDuplicates} already in the library. Live Instagram sync is unavailable.`,
        type: 'success'
      });
    } catch (err: any) {
      setStatusMsg({
        text: `Could not load sample media: ${err.message || 'Please try again.'}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Manual File Upload
  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');

      const newItem: InstagramMediaItem = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        caption: `[Manual Upload] ${file.name.replace(/\.[^/.]+$/, '')}`,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: url,
        thumbnailUrl: isVideo ? '/images/enhanced/thumbnails/roa-060-2026-11-05-thumb.webp' : url,
        permalink: 'https://www.instagram.com/readers.of.aurangabad/',
        timestamp: new Date().toISOString(),
        category: isVideo ? 'Reels' : 'Community Moments',
        status: 'draft',
        isCustomUpload: true
      };

      importInstagramMedia([newItem]);
    });

    setStatusMsg({ text: `Successfully imported ${files.length} file(s) into Website Media Library.`, type: 'success' });
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredMedia.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredMedia.map(m => m.id)));
    }
  };

  const publishSelected = () => {
    selectedItemIds.forEach(id => {
      updateInstagramMedia(id, { status: 'published' });
    });
    setSelectedItemIds(new Set());
    setStatusMsg({ text: 'Selected posts published to website!', type: 'success' });
  };

  const deleteSelected = () => {
    if (confirm(`Remove ${selectedItemIds.size} media item(s) from website library?`)) {
      selectedItemIds.forEach(id => deleteInstagramMedia(id));
      setSelectedItemIds(new Set());
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Banner: Connection Status & Global Actions */}
      <div className="paper-card p-6 rounded-3xl bg-white border border-[#D4CFC5] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">

        {/* Left: Account Connection Badge */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F3EB] border border-[#D4CFC5] flex items-center justify-center text-[#F47B49] shrink-0 p-2 shadow-xs">
            <InstagramIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-bold text-[#24262D]">
                Instagram Media Library
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F7F3EB] text-[#24262D] border border-[#24262D]/15">
                Live sync unavailable
              </span>
            </div>

            <p className="text-xs text-[#5E5B55]">
              Account: <strong className="text-[#24262D]">@{instagramConfig.username}</strong> • Type: {instagramConfig.accountType}
            </p>

            <span className="text-[11px] text-[#5E5B55] block">
              Live Instagram sync requires a trusted server-side integration. Sample media and manual imports are available.
            </span>
          </div>
        </div>

        {/* Right: Actions (Sync, Connect/Disconnect, Manual Upload) */}
        <div className="flex flex-wrap items-center gap-2.5">

          <button
            onClick={handleLoadSampleMedia}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 bg-[#24262D] hover:bg-[#F47B49] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Loading...' : 'Load Sample Media'}</span>
          </button>

          {/* Manual Upload Trigger */}
          <input
            type="file"
            ref={manualFileInputRef}
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={handleManualUpload}
            className="hidden"
          />
          <button
            onClick={() => manualFileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#D4CFC5] text-xs font-medium text-[#5E5B55] hover:text-[#24262D] hover:bg-[#F7F3EB] transition-colors"
            title="Upload local photographs or raw reel video files directly"
          >
            <Upload className="w-3.5 h-3.5 text-[#24262D]" />
            <span>Upload Manually</span>
          </button>

        </div>

      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
          statusMsg.type === 'success'
            ? 'bg-green-50 text-green-900 border border-green-200'
            : 'bg-[#F47B49]/15 text-red-900 border border-[#F47B49]/45'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar & Category Tabs */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#D4CFC5]">

        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#24262D] text-white shadow-xs'
                : 'text-[#5E5B55] hover:bg-[#F7F3EB]'
            }`}
          >
            All Categories ({instagramMedia.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = instagramMedia.filter(m => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#24262D] text-white shadow-xs'
                    : 'text-[#5E5B55] hover:bg-[#F7F3EB]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Second Filter Row: Media Type & Publication Status & Bulk Actions */}
        <div className="pt-2 border-t border-[#F7F3EB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5E5B55]">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#F7F3EB] border border-[#D4CFC5] font-medium text-[#24262D]"
              >
                <option value="All">All Types</option>
                <option value="IMAGE">Photos Only</option>
                <option value="VIDEO">Videos / Reels</option>
                <option value="CAROUSEL_ALBUM">Carousels</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-[#F7F3EB] border border-[#D4CFC5] font-medium text-[#24262D]"
              >
                <option value="all">All (Drafts & Published)</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts (Unpublished)</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1 rounded-lg border border-[#D4CFC5] hover:bg-[#F7F3EB] font-medium"
            >
              {selectedItemIds.size === filteredMedia.length && filteredMedia.length > 0 ? 'Deselect All' : 'Select All'}
            </button>

            {selectedItemIds.size > 0 && (
              <>
                <button
                  onClick={publishSelected}
                  className="px-3 py-1 rounded-lg bg-[#24262D] text-white font-medium hover:bg-[#24262D]"
                >
                  Publish ({selectedItemIds.size})
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 rounded-lg border border-[#F47B49]/45 text-red-600 font-medium hover:bg-[#F47B49]/15"
                >
                  Delete ({selectedItemIds.size})
                </button>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Media Items Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item) => {
            const isSelected = selectedItemIds.has(item.id);
            const isVideo = item.mediaType === 'VIDEO';

            return (
              <div
                key={item.id}
                className={`paper-card rounded-2xl overflow-hidden flex flex-col justify-between border transition-all ${
                  isSelected ? 'ring-2 ring-[#24262D] border-[#24262D]' : 'border-[#D4CFC5]'
                }`}
              >
                <div>
                  {/* Media Visual Area */}
                  <div className="relative h-60 bg-[#24262D] overflow-hidden group">
                    <img
                      src={item.thumbnailUrl || item.mediaUrl}
                      alt={item.caption.slice(0, 50)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const next = new Set(selectedItemIds);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          setSelectedItemIds(next);
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shadow-sm ${
                          isSelected ? 'bg-[#24262D] text-white' : 'bg-[#F7F3EB]/80 text-transparent hover:text-[#5E5B55]'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#24262D]/80 text-[#F7F3EB] backdrop-blur-xs flex items-center gap-1">
                        {isVideo ? <Play className="w-3 h-3 fill-current" /> : item.mediaType === 'CAROUSEL_ALBUM' ? <Layers className="w-3 h-3" /> : null}
                        <span>{item.mediaType}</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'published'
                          ? 'bg-green-100 text-green-900 border border-green-200'
                          : 'bg-[#FFD8C1] text-[#24262D] border border-[#FFD8C1]'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Primary Button Overlay for Video Frame Extractor */}
                    {isVideo && (
                      <div className="absolute inset-0 bg-[#24262D]/45 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setActiveExtractorMedia(item)}
                          className="inline-flex items-center gap-2 bg-[#F7F3EB] hover:bg-white text-[#24262D] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#F47B49]" />
                          <span>Extract Images from Video</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Info Area */}
                  <div className="p-5 space-y-3">

                    {/* Category Selector */}
                    <div className="flex items-center justify-between text-xs">
                      <select
                        value={item.category}
                        onChange={(e) => updateInstagramMedia(item.id, { category: e.target.value as MediaCategory })}
                        className="px-2 py-1 rounded-lg bg-[#F7F3EB] border border-[#D4CFC5] font-semibold text-[#F47B49] text-[11px]"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <span className="text-[10px] text-[#5E5B55]">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Editable Caption */}
                    <textarea
                      rows={3}
                      value={item.caption}
                      onChange={(e) => updateInstagramMedia(item.id, { caption: e.target.value })}
                      placeholder="Add or edit caption..."
                      className="w-full text-xs text-[#24262D] bg-[#F7F3EB] p-2.5 rounded-xl border border-[#D4CFC5] focus:outline-none focus:border-[#24262D] leading-relaxed resize-none"
                    />

                    {/* Stats if available */}
                    {(item.likesCount !== undefined || item.commentsCount !== undefined) && (
                      <div className="text-[10px] text-[#5E5B55] flex items-center gap-3">
                        {item.likesCount !== undefined && <span>❤️ {item.likesCount} likes</span>}
                        {item.commentsCount !== undefined && <span>💬 {item.commentsCount} comments</span>}
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="p-4 bg-white border-t border-[#F7F3EB] flex items-center justify-between gap-2">

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePublishInstagramMedia(item.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        item.status === 'published'
                          ? 'bg-[#FFD8C1]/45 text-[#24262D] border border-[#FFD8C1] hover:bg-[#FFD8C1]'
                          : 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{item.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <button
                      onClick={() => setShowAssignModal(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D4CFC5] hover:bg-[#F7F3EB] text-[11px] font-semibold text-[#24262D]"
                      title="Use in Meetups, Journal Cover or Gallery"
                    >
                      Use on Site
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {safeExternalHref(item.permalink) ? (
                      <a
                        href={safeExternalHref(item.permalink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-[#D4CFC5] text-[#5E5B55] hover:text-[#24262D]"
                        title="View original on Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}

                    <button
                      onClick={() => {
                        if (confirm('Delete this media from website library?')) {
                          deleteInstagramMedia(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-[#F47B49]/45 text-red-600 hover:bg-[#F47B49]/15"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#D4CFC5] rounded-3xl p-12 text-center space-y-3">
          <InstagramIcon className="w-10 h-10 text-[#5E5B55] mx-auto opacity-50" />
          <h4 className="font-serif text-xl font-bold text-[#24262D]">No media in this category</h4>
          <p className="text-xs text-[#5E5B55]">
            Load bundled sample media or <strong>"Upload Manually"</strong> to add photographs or reels. Live Instagram sync is unavailable.
          </p>
        </div>
      )}

      {/* Video-to-Image Frame Extraction Modal */}
      {activeExtractorMedia && (
  <VideoFrameExtractorModal
    key={activeExtractorMedia.id}
    mediaItem={activeExtractorMedia}
    onClose={() => setActiveExtractorMedia(null)}
  />
)}

      {/* Assign Media to Site Section Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-[#24262D]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card max-w-md w-full p-6 rounded-3xl bg-white border border-[#D4CFC5] space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#24262D]">
              Use Media on Website
            </h3>
            <p className="text-xs text-[#5E5B55]">
              Where would you like to feature this Instagram media?
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  assignMediaToTarget(showAssignModal.thumbnailUrl || showAssignModal.mediaUrl, 'gallery');
                  setShowAssignModal(null);
                  setStatusMsg({ text: 'Added to Community Moments Gallery!', type: 'success' });
                }}
                className="w-full text-left p-3 rounded-xl bg-[#F7F3EB] border border-[#D4CFC5] hover:border-[#24262D] flex items-center justify-between"
              >
                <div>
                  <strong className="block text-[#24262D]">Community Gallery</strong>
                  <span className="text-[#5E5B55]">Feature in photo mosaic on Community page</span>
                </div>
                <Plus className="w-4 h-4 text-[#24262D]" />
              </button>

              {meetups.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F7F3EB] border border-[#D4CFC5] space-y-2">
                  <strong className="block text-[#24262D]">Set as Meetup Cover Photo:</strong>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {meetups.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          assignMediaToTarget(showAssignModal.thumbnailUrl || showAssignModal.mediaUrl, 'meetup', m.id);
                          setShowAssignModal(null);
                          setStatusMsg({ text: `Assigned as cover for "${m.title}"!`, type: 'success' });
                        }}
                        className="w-full text-left py-1 px-2 rounded hover:bg-white text-[11px] truncate flex items-center justify-between"
                      >
                        <span>{m.title}</span>
                        <Check className="w-3 h-3 text-[#24262D]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {articles.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F7F3EB] border border-[#D4CFC5] space-y-2">
                  <strong className="block text-[#24262D]">Set as Journal Article Cover:</strong>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {articles.map(a => (
                      <button
                        key={a.id}
                        onClick={() => {
                          assignMediaToTarget(showAssignModal.thumbnailUrl || showAssignModal.mediaUrl, 'journal', a.id);
                          setShowAssignModal(null);
                          setStatusMsg({ text: `Assigned as cover for "${a.title}"!`, type: 'success' });
                        }}
                        className="w-full text-left py-1 px-2 rounded hover:bg-white text-[11px] truncate flex items-center justify-between"
                      >
                        <span>{a.title}</span>
                        <Check className="w-3 h-3 text-[#24262D]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5E5B55]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
