import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import { Upload, Search, FolderPlus, Image as ImageIcon } from 'lucide-react';

import type { Media } from '../../../server/src/schema';

export function MediaManager() {
  const [media, setMedia] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getMedia.query();
      setMedia(result);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const filteredMedia = media.filter(item =>
    item.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.alt_text && item.alt_text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-600">Loading media...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg sm:text-xl font-semibold">Media Library</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">Folder</span>
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload Media</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No media files</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No media found matching your search.' : 'Upload your first media file to get started.'}
          </p>
          {!searchQuery && (
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                {item.mime_type.startsWith('image/') ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                ) : (
                  <div className="text-xs font-mono text-gray-500">
                    {item.mime_type.split('/')[1]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-xs">
                <p className="font-medium truncate" title={item.original_name}>
                  {item.original_name}
                </p>
                <p className="text-gray-500">
                  {(item.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}