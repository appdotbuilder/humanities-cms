import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  GraduationCap,
  Briefcase,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Clock,
  Building
} from 'lucide-react';

import type { TimelineEntry, CreateTimelineEntryInput } from '../../../server/src/schema';

export function TimelineManager() {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [careerEntries, setCareerEntries] = useState<TimelineEntry[]>([]);
  const [educationEntries, setEducationEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateTimelineEntryInput>({
    title: '',
    organization: '',
    description: null,
    start_date: new Date(),
    end_date: null,
    is_current: false,
    entry_type: 'career',
    location: null,
    sort_order: 0
  });

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allEntries, career, education] = await Promise.all([
        trpc.getTimelineEntries.query(),
        trpc.getCareerEntries.query(),
        trpc.getEducationEntries.query()
      ]);
      
      setTimelineEntries(allEntries);
      setCareerEntries(career);
      setEducationEntries(education);
    } catch (error) {
      console.error('Failed to load timeline entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const resetForm = () => {
    setFormData({
      title: '',
      organization: '',
      description: null,
      start_date: new Date(),
      end_date: null,
      is_current: false,
      entry_type: 'career',
      location: null,
      sort_order: 0
    });
  };

  const handleCreate = async () => {
    try {
      await trpc.createTimelineEntry.mutate(formData);
      setShowCreateDialog(false);
      resetForm();
      await loadEntries();
    } catch (error) {
      console.error('Failed to create timeline entry:', error);
    }
  };

  const handleEdit = (entry: TimelineEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      organization: entry.organization,
      description: entry.description,
      start_date: entry.start_date,
      end_date: entry.end_date,
      is_current: entry.is_current,
      entry_type: entry.entry_type,
      location: entry.location,
      sort_order: entry.sort_order
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    
    try {
      await trpc.updateTimelineEntry.mutate({
        id: editingEntry.id,
        ...formData
      });
      setShowEditDialog(false);
      setEditingEntry(null);
      resetForm();
      await loadEntries();
    } catch (error) {
      console.error('Failed to update timeline entry:', error);
    }
  };

  const handleDelete = async (entry: TimelineEntry) => {
    if (!confirm(`Delete "${entry.title}" at ${entry.organization}?`)) return;
    
    try {
      await trpc.deleteTimelineEntry.mutate({ id: entry.id });
      await loadEntries();
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

  const getDateRange = (entry: TimelineEntry) => {
    const start = formatDate(entry.start_date);
    if (entry.is_current) {
      return `${start} - Present`;
    } else if (entry.end_date) {
      return `${start} - ${formatDate(entry.end_date)}`;
    } else {
      return start;
    }
  };

  const TimelineEntryForm = ({ onSubmit, onCancel, isEdit = false }: {
    onSubmit: () => void;
    onCancel: () => void;
    isEdit?: boolean;
  }) => (
    <div className="space-y-4">
      {/* Entry Type */}
      <div>
        <Label htmlFor="entry_type">Type</Label>
        <Select
          value={formData.entry_type}
          onValueChange={(value: 'career' | 'education') =>
            setFormData(prev => ({ ...prev, entry_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="career">Career</SelectItem>
            <SelectItem value="education">Education</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">
          {formData.entry_type === 'career' ? 'Job Title' : 'Degree/Program'}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, title: e.target.value }))
          }
          placeholder={
            formData.entry_type === 'career' 
              ? 'e.g. Senior Software Engineer' 
              : 'e.g. Master of Computer Science'
          }
          required
        />
      </div>

      {/* Organization */}
      <div>
        <Label htmlFor="organization">
          {formData.entry_type === 'career' ? 'Company' : 'Institution'}
        </Label>
        <Input
          id="organization"
          value={formData.organization}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, organization: e.target.value }))
          }
          placeholder={
            formData.entry_type === 'career'
              ? 'e.g. Tech Corp Inc.'
              : 'e.g. University of Technology'
          }
          required
        />
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location (Optional)</Label>
        <Input
          id="location"
          value={formData.location || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, location: e.target.value || null }))
          }
          placeholder="e.g. San Francisco, CA"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData(prev => ({ ...prev, description: e.target.value || null }))
          }
          placeholder="Describe your role, achievements, or coursework..."
          rows={4}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={
              formData.start_date
                ? new Date(formData.start_date.getTime() - formData.start_date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split('T')[0]
                : ''
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({
                ...prev,
                start_date: e.target.value ? new Date(e.target.value) : new Date()
              }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={
              formData.end_date
                ? new Date(formData.end_date.getTime() - formData.end_date.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split('T')[0]
                : ''
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData(prev => ({
                ...prev,
                end_date: e.target.value ? new Date(e.target.value) : null
              }))
            }
            disabled={formData.is_current}
          />
        </div>
      </div>

      {/* Current Position Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="is_current">
          {formData.entry_type === 'career' ? 'Current Position' : 'Currently Enrolled'}
        </Label>
        <Switch
          id="is_current"
          checked={formData.is_current}
          onCheckedChange={(checked: boolean) =>
            setFormData(prev => ({
              ...prev,
              is_current: checked,
              end_date: checked ? null : prev.end_date
            }))
          }
        />
      </div>

      {/* Sort Order */}
      <div>
        <Label htmlFor="sort_order">Display Order</Label>
        <Input
          id="sort_order"
          type="number"
          value={formData.sort_order}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
          }
          placeholder="0"
          min="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Lower numbers appear first in the timeline
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );

  const TimelineEntryCard = ({ entry }: { entry: TimelineEntry }) => (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 rounded-full bg-gray-100">
            {entry.entry_type === 'career' ? (
              <Briefcase className="h-5 w-5 text-blue-600" />
            ) : (
              <GraduationCap className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{entry.title}</h3>
            <div className="flex items-center space-x-2 text-gray-600 mb-2">
              <Building className="h-4 w-4" />
              <span>{entry.organization}</span>
              {entry.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {entry.location}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{getDateRange(entry)}</span>
              {entry.is_current && (
                <Badge variant="outline" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              )}
            </div>
            {entry.description && (
              <p className="text-gray-700 text-sm leading-relaxed">
                {entry.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(entry)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(entry)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🕒 Timeline Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Timeline Entry</DialogTitle>
            </DialogHeader>
            <TimelineEntryForm
              onSubmit={handleCreate}
              onCancel={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>

        {/* All Entries */}
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading timeline entries...</p>
            </div>
          ) : timelineEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No timeline entries yet</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            </div>
          ) : (
            timelineEntries.map((entry: TimelineEntry) => (
              <TimelineEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </TabsContent>

        {/* Career Entries */}
        <TabsContent value="career" className="space-y-4">
          {careerEntries.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No career entries yet</p>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, entry_type: 'career' }));
                setShowCreateDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Career Entry
              </Button>
            </div>
          ) : (
            careerEntries.map((entry: TimelineEntry) => (
              <TimelineEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </TabsContent>

        {/* Education Entries */}
        <TabsContent value="education" className="space-y-4">
          {educationEntries.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No education entries yet</p>
              <Button onClick={() => {
                setFormData(prev => ({ ...prev, entry_type: 'education' }));
                setShowCreateDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education Entry
              </Button>
            </div>
          ) : (
            educationEntries.map((entry: TimelineEntry) => (
              <TimelineEntryCard key={entry.id} entry={entry} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Timeline Entry</DialogTitle>
          </DialogHeader>
          <TimelineEntryForm
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditDialog(false);
              setEditingEntry(null);
              resetForm();
            }}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}