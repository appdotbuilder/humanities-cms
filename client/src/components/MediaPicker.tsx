import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Upload, 
  Search,
  Grid,
  List,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Filter
} from 'lucide-react';

import type { Media, MediaFolder } from '../../../server/src/schema';

interface MediaPickerProps {
  onSelect: (media: Media) => void;
  onClose: () => void;
  allowMultiple?: boolean;
}

export function MediaPicker({ onSelect, onClose, allowMultiple = false }: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

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
    if (allowMultiple) {
      setSelectedMedia((prev: Media[]) => {
        const isSelected = prev.some(m => m.id === mediaItem.id);
        if (isSelected) {
          return prev.filter(m => m.id !== mediaItem.id);
        } else {
          return [...prev, mediaItem];
        }
      });
    } else {
      onSelect(mediaItem);
    }
  };

  const handleSelectMultiple = () => {
    if (selectedMedia.length > 0) {
      // For now, just select the first one
      // Could be extended to handle multiple selections
      onSelect(selectedMedia[0]);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onClose} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">
                📁 Select Media - {getCurrentFolderName()}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {allowMultiple && selectedMedia.length > 0 && (
                <Button onClick={handleSelectMultiple}>
                  Select ({selectedMedia.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                    </div>
                    {mediaItem.width && mediaItem.height && (
                      <Badge variant="secondary" className="mr-4">
                        {mediaItem.width} × {mediaItem.height}
                      </Badge>
                    )}
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}