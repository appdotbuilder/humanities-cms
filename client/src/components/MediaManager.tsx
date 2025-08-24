import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Search,
  Grid,
  List,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Filter,
  FolderPlus,
  Edit,
  Trash2,
  Download,
  Eye,
  Move,
  Info
} from 'lucide-react';

import type { Media, MediaFolder } from '../../../server/src/schema';

export function MediaManager() {
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  
  // Forms
  const [newFolderName, setNewFolderName] = useState('');
  const [editForm, setEditForm] = useState({
    alt_text: '',
    description: ''
  });

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      let result: Media[];
      
      if (currentFolder !== null) {
        result = await trpc.getMediaByFolder.query({ folderId: currentFolder });
      } else if (searchQuery) {
        result = await trpc.searchMedia.query({ query: searchQuery });
      } else {
        result = await trpc.getMedia.query();
      }
      
      // Filter by type if specified
      if (filterType !== 'all') {
        result = result.filter((item: Media) => {
          const mimeType = item.mime_type;
          switch (filterType) {
            case 'image':
              return mimeType.startsWith('image/');
            case 'video':
              return mimeType.startsWith('video/');
            case 'audio':
              return mimeType.startsWith('audio/');
            case 'document':
              return mimeType.startsWith('application/') || mimeType.startsWith('text/');
            default:
              return true;
          }
        });
      }
      
      setMedia(result);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, searchQuery, filterType]);

  const loadFolders = useCallback(async () => {
    try {
      const result = await trpc.getMediaFolders.query();
      setFolders(result);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  useEffect(() => {
    loadMedia();
    loadFolders();
  }, [loadMedia, loadFolders]);

  const handleMediaClick = (mediaItem: Media) => {
    setSelectedMedia((prev: Media[]) => {
      const isSelected = prev.some(m => m.id === mediaItem.id);
      if (isSelected) {
        return prev.filter(m => m.id !== mediaItem.id);
      } else {
        return [...prev, mediaItem];
      }
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await trpc.createMediaFolder.mutate({
        name: newFolderName.trim(),
        parent_id: currentFolder
      });
      setNewFolderName('');
      setShowFolderDialog(false);
      await loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleEditMedia = (mediaItem: Media) => {
    setEditingMedia(mediaItem);
    setEditForm({
      alt_text: mediaItem.alt_text || '',
      description: mediaItem.description || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;
    
    try {
      await trpc.updateMedia.mutate({
        id: editingMedia.id,
        alt_text: editForm.alt_text || null,
        description: editForm.description || null
      });
      setShowEditDialog(false);
      setEditingMedia(null);
      await loadMedia();
    } catch (error) {
      console.error('Failed to update media:', error);
    }
  };

  const handleDeleteMedia = async (mediaItem: Media) => {
    if (!confirm(`Delete "${mediaItem.original_name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await trpc.deleteMedia.mutate({ id: mediaItem.id });
      await loadMedia();
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  const handleBulkMove = async (targetFolderId: number | null) => {
    if (selectedMedia.length === 0) return;
    
    try {
      await trpc.moveMedia.mutate({
        mediaIds: selectedMedia.map(m => m.id),
        targetFolderId
      });
      setSelectedMedia([]);
      await loadMedia();
    } catch (error) {
      console.error('Failed to move media:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return FileText;
    return Archive;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCurrentFolderName = () => {
    if (currentFolder === null) return 'All Media';
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : 'Unknown Folder';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          📁 Media Library - {getCurrentFolderName()}
        </h2>
        <div className="flex items-center space-x-2">
          {selectedMedia.length > 0 && (
            <>
              <Select onValueChange={(value) => handleBulkMove(value === 'root' ? null : parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root Folder</SelectItem>
                  {folders.map((folder: MediaFolder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary">
                {selectedMedia.length} selected
              </Badge>
            </>
          )}
          <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Folder Filter */}
        <Select
          value={currentFolder?.toString() || 'all'}
          onValueChange={(value) => setCurrentFolder(value === 'all' ? null : parseInt(value))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map((folder: MediaFolder) => (
              <SelectItem key={folder.id} value={folder.id.toString()}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No media found</p>
          <Button className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First File
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 
          'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 
          'space-y-2'
        }>
          {media.map((mediaItem: Media) => {
            const isSelected = selectedMedia.some(m => m.id === mediaItem.id);
            const FileIcon = getFileIcon(mediaItem.mime_type);
            
            return viewMode === 'grid' ? (
              <Card
                key={mediaItem.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleMediaClick(mediaItem)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-md">
                  {mediaItem.mime_type.startsWith('image/') ? (
                    <img
                      src={`/uploads/${mediaItem.filename}`}
                      alt={mediaItem.alt_text || mediaItem.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMedia(mediaItem);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(mediaItem);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium truncate" title={mediaItem.original_name}>
                    {mediaItem.original_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(mediaItem.size)}
                  </p>
                </div>
              </Card>
            ) : (
              <Card
                key={mediaItem.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleMediaClick(mediaItem)}
              >
                <div className="flex items-center p-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md mr-4">
                    {mediaItem.mime_type.startsWith('image/') ? (
                      <img
                        src={`/uploads/${mediaItem.filename}`}
                        alt={mediaItem.alt_text || mediaItem.original_name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <FileIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{mediaItem.original_name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatFileSize(mediaItem.size)}</span>
                      <span>•</span>
                      <span>{mediaItem.created_at.toLocaleDateString()}</span>
                    </div>
                    {mediaItem.alt_text && (
                      <p className="text-xs text-gray-600 truncate mt-1">{mediaItem.alt_text}</p>
                    )}
                  </div>
                  {mediaItem.width && mediaItem.height && (
                    <Badge variant="secondary" className="mr-4">
                      {mediaItem.width} × {mediaItem.height}
                    </Badge>
                  )}
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMedia(mediaItem);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(mediaItem);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Media Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
          </DialogHeader>
          {editingMedia && (
            <div className="space-y-4">
              {editingMedia.mime_type.startsWith('image/') && (
                <div className="text-center">
                  <img
                    src={`/uploads/${editingMedia.filename}`}
                    alt={editingMedia.original_name}
                    className="max-w-full h-48 object-contain mx-auto rounded-md"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="alt-text">Alt Text</Label>
                <Input
                  id="alt-text"
                  value={editForm.alt_text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm(prev => ({ ...prev, alt_text: e.target.value }))
                  }
                  placeholder="Describe the image for accessibility"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Optional description or caption"
                  rows={3}
                />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Size: {formatFileSize(editingMedia.size)}</span>
                {editingMedia.width && editingMedia.height && (
                  <span>Dimensions: {editingMedia.width} × {editingMedia.height}</span>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMedia}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}