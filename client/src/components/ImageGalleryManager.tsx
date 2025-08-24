import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Image as ImageIcon, Search } from 'lucide-react';

import type { ImageGallery } from '../../../server/src/schema';

export function ImageGalleryManager() {
  const [galleries, setGalleries] = useState<ImageGallery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadGalleries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getImageGalleries.query();
      setGalleries(result);
    } catch (error) {
      console.error('Failed to load galleries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;
    
    try {
      // Note: This would need to be implemented in the backend
      // await trpc.deleteImageGallery.mutate({ id });
      setGalleries(prev => prev.filter(gallery => gallery.id !== id));
    } catch (error) {
      console.error('Failed to delete gallery:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.draft}>
        {status}
      </Badge>
    );
  };

  const filteredGalleries = galleries.filter(gallery =>
    gallery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (gallery.description && gallery.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-600">Loading galleries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg sm:text-xl font-semibold">Image Galleries</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Button className="self-start sm:self-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Gallery</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {filteredGalleries.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No galleries found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No galleries match your search.' : 'Create your first image gallery to showcase your work.'}
          </p>
          {!searchQuery && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Gallery
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredGalleries.map((gallery) => (
            <Card key={gallery.id} className="p-4 sm:p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    {gallery.title}
                  </h3>
                  {gallery.description && (
                    <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2">
                      {gallery.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Created {formatDate(gallery.created_at)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      Slug: /{gallery.slug}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {getStatusBadge(gallery.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 sm:px-3"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:ml-1 sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gallery.id)}
                      className="px-2 sm:px-3"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:ml-1 sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}