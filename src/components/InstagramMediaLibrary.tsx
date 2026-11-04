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
  Key, 
  ShieldCheck
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { VideoFrameExtractorModal } from './VideoFrameExtractorModal';
import { 
  fetchFromInstagramGraphAPI, 
  SAMPLE_INSTAGRAM_POSTS
} from '../services/instagramService';

const CATEGORIES: MediaCategory[] = [
  'Meetups',
  'Reading Sessions',
  'Community Moments',
  'Reels',
  'Event Highlights',
  'Announcements',
  'Behind the Scenes',
  'Other'
];

export const InstagramMediaLibrary: React.FC = () => {
  const { 
    instagramConfig, 
    updateInstagramConfig, 
    disconnectInstagram,
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
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<InstagramMediaItem | null>(null);

  // Connect form inputs
  const [inputToken, setInputToken] = useState('');
  const [inputUserId, setInputUserId] = useState('');
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

  // Handle Sync
  const handleSyncInstagram = async () => {
    setIsSyncing(true);
    setStatusMsg(null);

    try {
      let incomingPosts: InstagramMediaItem[] = [];

      if (instagramConfig.connected && instagramConfig.accessToken) {
        // Fetch from live Meta Instagram Graph API
        incomingPosts = await fetchFromInstagramGraphAPI(instagramConfig.accessToken, inputUserId || 'me');
      } else {
        // Use verified @readers.of.aurangabad collection
        incomingPosts = SAMPLE_INSTAGRAM_POSTS;
      }

      const { added, skippedDuplicates } = importInstagramMedia(incomingPosts);
      
      updateInstagramConfig({
        lastSyncedAt: new Date().toISOString()
      });

      setStatusMsg({
        text: `Sync complete! Discovered ${added} new posts (skipped ${skippedDuplicates} already in library).`,
        type: 'success'
      });
    } catch (err: any) {
      setStatusMsg({
        text: `Sync error: ${err.message || 'Could not connect to Instagram Graph API. Please verify token.'}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Connect Token
  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      // Connect in sandbox mode
      updateInstagramConfig({
        connected: true,
        username: 'readers.of.aurangabad',
        accountType: 'CREATOR',
        lastSyncedAt: new Date().toISOString()
      });
      setShowConnectModal(false);
      setStatusMsg({ text: 'Connected to @readers.of.aurangabad (Sandbox mode). You can now sync content!', type: 'success' });
      return;
    }

    updateInstagramConfig({
      connected: true,
      username: 'readers.of.aurangabad',
      accountType: 'CREATOR',
      accessToken: inputToken.trim(),
      lastSyncedAt: new Date().toISOString()
    });

    setShowConnectModal(false);
    setStatusMsg({ text: 'Meta Graph API token configured successfully!', type: 'success' });
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
        thumbnailUrl: isVideo ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' : url,
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
      <div className="paper-card p-6 rounded-3xl bg-white border border-[#E8E2D5] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        
        {/* Left: Account Connection Badge */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C] shrink-0 p-2 shadow-xs">
            <InstagramIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">
                Instagram Media Library
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                instagramConfig.connected 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {instagramConfig.connected ? 'Authorized' : 'Not Connected'}
              </span>
            </div>

            <p className="text-xs text-[#595550]">
              Account: <strong className="text-[#1C1B1A]">@{instagramConfig.username}</strong> • Type: {instagramConfig.accountType}
              {instagramConfig.lastSyncedAt && (
                <span> • Last Synced: {new Date(instagramConfig.lastSyncedAt).toLocaleDateString()}</span>
              )}
            </p>

            <span className="text-[11px] text-[#8C857B] block">
              Official Meta Graph API Integration • Passwords are never requested or stored.
            </span>
          </div>
        </div>

        {/* Right: Actions (Sync, Connect/Disconnect, Manual Upload) */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <button
            onClick={handleSyncInstagram}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 bg-[#1C1B1A] hover:bg-[#455240] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Instagram'}</span>
          </button>

          {instagramConfig.connected ? (
            <button
              onClick={disconnectInstagram}
              className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-xs font-semibold text-[#1C1B1A] hover:bg-white transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-[#8D5B4C]" />
              <span>Connect Meta Token</span>
            </button>
          )}

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
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-medium text-[#595550] hover:text-[#1C1B1A] hover:bg-[#FAF8F5] transition-colors"
            title="Upload local photographs or raw reel video files directly"
          >
            <Upload className="w-3.5 h-3.5 text-[#455240]" />
            <span>Upload Manually</span>
          </button>

        </div>

      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
          statusMsg.type === 'success' 
            ? 'bg-green-50 text-green-900 border border-green-200' 
            : 'bg-red-50 text-red-900 border border-red-200'
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
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E8E2D5]">
        
        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#1C1B1A] text-white shadow-xs'
                : 'text-[#595550] hover:bg-[#FAF8F5]'
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
                    ? 'bg-[#1C1B1A] text-white shadow-xs'
                    : 'text-[#595550] hover:bg-[#FAF8F5]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Second Filter Row: Media Type & Publication Status & Bulk Actions */}
        <div className="pt-2 border-t border-[#F4EFEA] flex flex-wrap items-center justify-between gap-3 text-xs text-[#595550]">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] font-medium text-[#1C1B1A]"
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
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] font-medium text-[#1C1B1A]"
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
              className="px-3 py-1 rounded-lg border border-[#E8E2D5] hover:bg-[#FAF8F5] font-medium"
            >
              {selectedItemIds.size === filteredMedia.length && filteredMedia.length > 0 ? 'Deselect All' : 'Select All'}
            </button>

            {selectedItemIds.size > 0 && (
              <>
                <button
                  onClick={publishSelected}
                  className="px-3 py-1 rounded-lg bg-[#455240] text-white font-medium hover:bg-[#2E372B]"
                >
                  Publish ({selectedItemIds.size})
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-1 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50"
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
                  isSelected ? 'ring-2 ring-[#455240] border-[#455240]' : 'border-[#E8E2D5]'
                }`}
              >
                <div>
                  {/* Media Visual Area */}
                  <div className="relative h-60 bg-[#1C1B1A] overflow-hidden group">
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
                          isSelected ? 'bg-[#455240] text-white' : 'bg-white/80 text-transparent hover:text-gray-400'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                        {isVideo ? <Play className="w-3 h-3 fill-current" /> : item.mediaType === 'CAROUSEL_ALBUM' ? <Layers className="w-3 h-3" /> : null}
                        <span>{item.mediaType}</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'published' 
                          ? 'bg-green-100 text-green-900 border border-green-200' 
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Primary Button Overlay for Video Frame Extractor */}
                    {isVideo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setActiveExtractorMedia(item)}
                          className="inline-flex items-center gap-2 bg-[#FAF8F5] hover:bg-white text-[#1C1B1A] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg hover:scale-105 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#8D5B4C]" />
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
                        className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D5] font-semibold text-[#8D5B4C] text-[11px]"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <span className="text-[10px] text-[#8C857B]">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Editable Caption */}
                    <textarea
                      rows={3}
                      value={item.caption}
                      onChange={(e) => updateInstagramMedia(item.id, { caption: e.target.value })}
                      placeholder="Add or edit caption..."
                      className="w-full text-xs text-[#2A2826] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D5] focus:outline-none focus:border-[#455240] leading-relaxed resize-none"
                    />

                    {/* Stats if available */}
                    {(item.likesCount !== undefined || item.commentsCount !== undefined) && (
                      <div className="text-[10px] text-[#8C857B] flex items-center gap-3">
                        {item.likesCount !== undefined && <span>❤️ {item.likesCount} likes</span>}
                        {item.commentsCount !== undefined && <span>💬 {item.commentsCount} comments</span>}
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="p-4 bg-white border-t border-[#F4EFEA] flex items-center justify-between gap-2">
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => togglePublishInstagramMedia(item.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        item.status === 'published' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100' 
                          : 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{item.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <button
                      onClick={() => setShowAssignModal(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] hover:bg-[#FAF8F5] text-[11px] font-semibold text-[#1C1B1A]"
                      title="Use in Meetups, Journal Cover or Gallery"
                    >
                      Use on Site
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-[#E8E2D5] text-[#595550] hover:text-[#1C1B1A]"
                      title="View original on Instagram"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => {
                        if (confirm('Delete this media from website library?')) {
                          deleteInstagramMedia(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
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
        <div className="bg-white border border-[#E8E2D5] rounded-3xl p-12 text-center space-y-3">
          <InstagramIcon className="w-10 h-10 text-[#8C857B] mx-auto opacity-50" />
          <h4 className="font-serif text-xl font-bold text-[#1C1B1A]">No media in this category</h4>
          <p className="text-xs text-[#595550]">
            Click <strong>"Sync Instagram"</strong> above to retrieve recent posts, or <strong>"Upload Manually"</strong> to add photographs or reels.
          </p>
        </div>
      )}

      {/* Video-to-Image Frame Extraction Modal */}
      <VideoFrameExtractorModal
        mediaItem={activeExtractorMedia}
        onClose={() => setActiveExtractorMedia(null)}
      />

      {/* Assign Media to Site Section Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card max-w-md w-full p-6 rounded-3xl bg-white border border-[#E8E2D5] space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">
              Use Media on Website
            </h3>
            <p className="text-xs text-[#595550]">
              Where would you like to feature this Instagram media?
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  assignMediaToTarget(showAssignModal.thumbnailUrl || showAssignModal.mediaUrl, 'gallery');
                  setShowAssignModal(null);
                  setStatusMsg({ text: 'Added to Community Moments Gallery!', type: 'success' });
                }}
                className="w-full text-left p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#1C1B1A] flex items-center justify-between"
              >
                <div>
                  <strong className="block text-[#1C1B1A]">Community Gallery</strong>
                  <span className="text-[#8C857B]">Feature in photo mosaic on Community page</span>
                </div>
                <Plus className="w-4 h-4 text-[#455240]" />
              </button>

              {meetups.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <strong className="block text-[#1C1B1A]">Set as Meetup Cover Photo:</strong>
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
                        <Check className="w-3 h-3 text-[#455240]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {articles.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-2">
                  <strong className="block text-[#1C1B1A]">Set as Journal Article Cover:</strong>
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
                        <Check className="w-3 h-3 text-[#455240]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#595550]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta Token Configuration Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-center text-[#8D5B4C]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1C1B1A]">
                  Connect Meta Instagram Graph API
                </h3>
                <span className="text-xs text-[#8C857B]">
                  Official Authorization for @readers.of.aurangabad
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-xs text-[#595550] space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#1C1B1A]">
                <ShieldCheck className="w-4 h-4 text-[#455240]" />
                <span>Meta API Security Standards:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Meta allows content access via long-lived <strong>User Access Tokens</strong>.</li>
                <li>Your Instagram password is never requested, stored, or processed.</li>
                <li>Leave the token empty to test in <strong>Verified Sandbox Mode</strong> with actual @readers.of.aurangabad posts immediately!</li>
              </ul>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">
                  Meta Graph API User Token (Optional)
                </label>
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="EAA... (or leave blank to enable sandbox mode)"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:outline-none focus:border-[#455240]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1B1A] mb-1">
                  Instagram Professional Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={inputUserId}
                  onChange={(e) => setInputUserId(e.target.value)}
                  placeholder="Defaults to 'me'"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] focus:outline-none focus:border-[#455240]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#595550]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-[#455240]"
                >
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
