import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Building,
  GraduationCap,
  Briefcase,
  Clock
} from 'lucide-react';
import { trpc } from '@/utils/trpc';

import type { TimelineEntry } from '../../../server/src/schema';

export function TimelineManager() {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [careerEntries, setCareerEntries] = useState<TimelineEntry[]>([]);
  const [educationEntries, setEducationEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allEntries, career, education] = await Promise.all([
        trpc.getTimelineEntries.query().catch(() => []),
        trpc.getCareerEntries.query().catch(() => []),
        trpc.getEducationEntries.query().catch(() => [])
      ]);
      
      setTimelineEntries(allEntries);
      setCareerEntries(career);
      setEducationEntries(education);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timeline entry?')) return;
    
    try {
      await trpc.deleteTimelineEntry.mutate({ id });
      loadTimeline(); // Refresh data
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

  const formatDateRange = (startDate: Date, endDate: Date | null, isCurrent: boolean) => {
    const start = formatDate(startDate);
    if (isCurrent) return `${start} - Present`;
    if (endDate) return `${start} - ${formatDate(endDate)}`;
    return start;
  };

  const TimelineEntryCard = ({ entry, type }: { entry: TimelineEntry, type?: string }) => {
    const Icon = entry.entry_type === 'career' ? Briefcase : GraduationCap;
    
    return (
      <Card key={entry.id} className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`p-2 rounded-full ${
              entry.entry_type === 'career' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <Icon className={`h-5 w-5 ${
                entry.entry_type === 'career' ? 'text-blue-600' : 'text-green-600'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {entry.title}
              </h3>
              
              <div className="flex items-center text-gray-600 mb-2">
                <Building className="h-4 w-4 mr-1" />
                <span className="font-medium">{entry.organization}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 mb-3 space-y-1 sm:space-y-0">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDateRange(entry.start_date, entry.end_date, entry.is_current)}
                </div>
                
                {entry.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {entry.location}
                  </div>
                )}
              </div>
              
              {entry.description && (
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {entry.description}
                </p>
              )}
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {entry.entry_type === 'career' ? 'Career' : 'Education'}
                </Badge>
                {entry.is_current && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDelete(entry.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Timeline Management</h2>
          <p className="text-sm text-gray-600">
            Manage your career and education history
          </p>
        </div>
        <Button className="flex items-center self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Timeline Entry
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Entries ({timelineEntries.length})</TabsTrigger>
          <TabsTrigger value="career">Career ({careerEntries.length})</TabsTrigger>
          <TabsTrigger value="education">Education ({educationEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {timelineEntries.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline entries</h3>
              <p className="text-gray-500 mb-4">
                Start building your professional timeline by adding your career and education history.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {timelineEntries
                .sort((a, b) => {
                  // Sort by start date, most recent first
                  return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                })
                .map((entry) => (
                  <TimelineEntryCard key={entry.id} entry={entry} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="career" className="space-y-4">
          {careerEntries.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No career entries</h3>
              <p className="text-gray-500 mb-4">
                Add your work experience and professional positions.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Career Entry
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {careerEntries
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                .map((entry) => (
                  <TimelineEntryCard key={entry.id} entry={entry} type="career" />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          {educationEntries.length === 0 ? (
            <Card className="p-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No education entries</h3>
              <p className="text-gray-500 mb-4">
                Add your educational background and qualifications.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Education Entry
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {educationEntries
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                .map((entry) => (
                  <TimelineEntryCard key={entry.id} entry={entry} type="education" />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}