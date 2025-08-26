import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { MediaPicker } from './MediaPicker';
import type { Media } from '../../../server/src/schema';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  // Execute document command
  const execCommand = useCallback((command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Format commands
  const toggleBold = () => execCommand('bold');
  const toggleItalic = () => execCommand('italic');
  const toggleUnderline = () => execCommand('underline');
  const toggleOrderedList = () => execCommand('insertOrderedList');
  const toggleUnorderedList = () => execCommand('insertUnorderedList');
  const insertBlockquote = () => execCommand('formatBlock', 'blockquote');
  const insertH1 = () => execCommand('formatBlock', 'h1');
  const insertH2 = () => execCommand('formatBlock', 'h2');
  const insertH3 = () => execCommand('formatBlock', 'h3');
  const alignLeft = () => execCommand('justifyLeft');
  const alignCenter = () => execCommand('justifyCenter');
  const alignRight = () => execCommand('justifyRight');

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      
      if (range.collapsed) {
        code.textContent = 'Your code here...';
      } else {
        code.appendChild(range.extractContents());
      }
      
      pre.appendChild(code);
      pre.style.backgroundColor = '#f4f4f4';
      pre.style.padding = '12px';
      pre.style.borderRadius = '6px';
      pre.style.fontFamily = 'monospace';
      pre.style.margin = '12px 0';
      pre.style.whiteSpace = 'pre-wrap';
      
      range.insertNode(pre);
      selection.removeAllRanges();
    }
    handleInput();
  };

  const insertLink = useCallback(() => {
    if (!linkUrl) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.href = linkUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      if (linkText) {
        link.textContent = linkText;
        range.deleteContents();
        range.insertNode(link);
      } else if (range.collapsed) {
        link.textContent = linkUrl;
        range.insertNode(link);
      } else {
        link.appendChild(range.extractContents());
        range.insertNode(link);
      }
      
      selection.removeAllRanges();
    }

    setLinkUrl('');
    setLinkText('');
    setIsLinkDialogOpen(false);
    handleInput();
  }, [linkUrl, linkText, handleInput]);

  const insertYouTube = useCallback(() => {
    if (!youtubeUrl) return;

    // Extract video ID from various YouTube URL formats
    let videoId = '';
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    
    if (match && match[7].length === 11) {
      videoId = match[7];
    }

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.width = '560';
      iframe.height = '315';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.style.maxWidth = '100%';
      iframe.style.margin = '12px 0';

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(iframe);
        
        // Add a line break after the iframe
        const br = document.createElement('br');
        range.setStartAfter(iframe);
        range.insertNode(br);
        
        selection.removeAllRanges();
      }
    }

    setYoutubeUrl('');
    setIsYouTubeDialogOpen(false);
    handleInput();
  }, [youtubeUrl, handleInput]);

  const handleMediaSelect = useCallback((media: Media) => {
    const img = document.createElement('img');
    img.src = `/uploads/${media.filename}`;
    img.alt = media.alt_text || media.original_name;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '12px 0';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      
      // Add a line break after the image
      const br = document.createElement('br');
      range.setStartAfter(img);
      range.insertNode(br);
      
      selection.removeAllRanges();
    }

    setIsMediaPickerOpen(false);
    handleInput();
  }, [handleInput]);

  // Check if a command is currently active
  const isCommandActive = useCallback((command: string, value?: string) => {
    try {
      if (value) {
        return document.queryCommandValue(command) === value;
      }
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  }, []);

  return (
    <div className={`w-full border border-input rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-input bg-muted/50">
        {/* Text formatting */}
        <Button
          variant={isCommandActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleBold}
          type="button"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant={isCommandActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleItalic}
          type="button"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant={isCommandActive('underline') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleUnderline}
          type="button"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertH1}
          type="button"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={insertH2}
          type="button"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={insertH3}
          type="button"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={isCommandActive('insertUnorderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleUnorderedList}
          type="button"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant={isCommandActive('insertOrderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleOrderedList}
          type="button"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Text alignment */}
        <Button
          variant={isCommandActive('justifyLeft') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={alignLeft}
          type="button"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant={isCommandActive('justifyCenter') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={alignCenter}
          type="button"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant={isCommandActive('justifyRight') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={alignRight}
          type="button"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Block elements */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertBlockquote}
          type="button"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={insertCodeBlock}
          type="button"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLinkDialogOpen(true)}
          type="button"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMediaPickerOpen(true)}
          type="button"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsYouTubeDialogOpen(true)}
          type="button"
          title="Embed YouTube Video"
        >
          <Youtube className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none bg-white"
        style={{
          lineHeight: '1.6',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* CSS for styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .prose blockquote {
            border-left: 4px solid #d1d5db;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: #6b7280;
          }
          .prose pre {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 12px;
            margin: 12px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
          }
          .prose pre code {
            background-color: transparent;
            padding: 0;
          }
          .prose h1 {
            font-size: 2rem;
            font-weight: bold;
            margin: 1.5rem 0 1rem 0;
            line-height: 1.2;
          }
          .prose h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 1.25rem 0 0.75rem 0;
            line-height: 1.3;
          }
          .prose h3 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 1rem 0 0.5rem 0;
            line-height: 1.4;
          }
          .prose ul, .prose ol {
            margin: 1rem 0;
            padding-left: 2rem;
          }
          .prose li {
            margin: 0.25rem 0;
          }
          .prose a {
            color: #3b82f6;
            text-decoration: underline;
          }
          .prose a:hover {
            color: #1d4ed8;
          }
          .prose img {
            max-width: 100%;
            height: auto;
            margin: 12px 0;
            border-radius: 6px;
          }
          .prose iframe {
            max-width: 100%;
            margin: 12px 0;
            border-radius: 6px;
          }
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            font-style: italic;
            pointer-events: none;
          }
          [contenteditable]:focus:before {
            display: none;
          }
        `
      }} />

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={linkUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Link Text (optional)</label>
              <Input
                value={linkText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkText(e.target.value)}
                placeholder="Link text"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsLinkDialogOpen(false)} 
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={insertLink} type="button" disabled={!linkUrl}>
                Insert Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={isYouTubeDialogOpen} onOpenChange={setIsYouTubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">YouTube URL</label>
              <Input
                value={youtubeUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                type="url"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsYouTubeDialogOpen(false)} 
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={insertYouTube} type="button" disabled={!youtubeUrl}>
                Embed Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Picker Dialog */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Image</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[500px]">
            <MediaPicker 
              onSelect={handleMediaSelect} 
              onClose={() => setIsMediaPickerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}