import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Trash2,
  Eye,
  Edit,
  FolderPlus,
  Folder
} from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { Media, MediaFolder } from '../../../server/src/schema';

export function MediaManager() {
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      let result: Media[];
      
      if (currentFolder !== null) {
        result = await trpc.getMediaByFolder.query({ folderId: currentFolder }).catch(() => []);
      } else if (searchQuery) {
        result = await trpc.searchMedia.query({ query: searchQuery }).catch(() => []);
      } else {
        result = await trpc.getMedia.query().catch(() => []);
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
      const result = await trpc.getMediaFolders.query().catch(() => []);
      setFolders(result);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  useEffect(() => {
    loadMedia();
    loadFolders();
  }, [loadMedia, loadFolders]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    
    try {
      await trpc.deleteMedia.mutate({ id });
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete media:', error);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Media Library</h2>
          <p className="text-sm text-gray-600">
            Current folder: {getCurrentFolderName()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
          <Button
            variant="outline"
            className="flex items-center"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
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
                <div className="flex items-center">
                  <Folder className="h-4 w-4 mr-2" />
                  {folder.name}
                </div>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || currentFolder !== null ? 
              'Try adjusting your search or filters.' : 
              'Upload your first media file to get started.'
            }
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 
          'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 
          'space-y-2'
        }>
          {media.map((mediaItem: Media) => {
            const FileIcon = getFileIcon(mediaItem.mime_type);
            
            return viewMode === 'grid' ? (
              <Card key={mediaItem.id} className="group overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
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
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(mediaItem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
              <Card key={mediaItem.id} className="group">
                <div className="flex items-center p-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md mr-4 flex-shrink-0">
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
                      {mediaItem.width && mediaItem.height && (
                        <>
                          <span>•</span>
                          <span>{mediaItem.width} × {mediaItem.height}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(mediaItem.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Media upload functionality coming soon!</p>
            <Button onClick={() => setShowUploadDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}