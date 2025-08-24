import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Briefcase, GraduationCap, Calendar, MapPin } from 'lucide-react';

import type { TimelineEntry } from '../../../server/src/schema';

export function TimelineManager() {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTimelineEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTimelineEntries.query();
      setTimelineEntries(result);
    } catch (error) {
      console.error('Failed to load timeline entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimelineEntries();
  }, [loadTimelineEntries]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await trpc.deleteTimelineEntry.mutate({ id });
      setTimelineEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Failed to delete timeline entry:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const careerEntries = timelineEntries.filter(entry => entry.entry_type === 'career')
    .sort((a, b) => b.sort_order - a.sort_order);
  
  const educationEntries = timelineEntries.filter(entry => entry.entry_type === 'education')
    .sort((a, b) => b.sort_order - a.sort_order);

  const TimelineList = ({ entries, type }: { entries: TimelineEntry[], type: 'career' | 'education' }) => (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          {type === 'career' ? (
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {type} entries yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first {type} entry to build your timeline.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add {type === 'career' ? 'Career' : 'Education'} Entry
          </Button>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {entry.title}
                    </h3>
                    <p className="text-blue-600 font-medium mb-1">
                      {entry.organization}
                    </p>
                    {entry.location && (
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {entry.location}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-2 sm:mt-0">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(entry.start_date)}
                    {entry.is_current 
                      ? ' - Present' 
                      : entry.end_date 
                        ? ` - ${formatDate(entry.end_date)}` 
                        : ''
                    }
                  </div>
                </div>
                
                {entry.description && (
                  <p className="text-gray-700 text-sm sm:text-base mb-4">
                    {entry.description}
                  </p>
                )}

                {entry.is_current && (
                  <Badge className="bg-green-100 text-green-800 mb-4">
                    Current
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2">
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
                  onClick={() => handleDelete(entry.id)}
                  className="px-2 sm:px-3"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:ml-1 sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-pulse text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg sm:text-xl font-semibold">Timeline Management</h2>
        <Button className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Entry</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <Tabs defaultValue="career" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="career" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Career ({careerEntries.length})
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center">
            <GraduationCap className="h-4 w-4 mr-2" />
            Education ({educationEntries.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="career" className="mt-6">
          <TimelineList entries={careerEntries} type="career" />
        </TabsContent>
        
        <TabsContent value="education" className="mt-6">
          <TimelineList entries={educationEntries} type="education" />
        </TabsContent>
      </Tabs>
    </div>
  );
}