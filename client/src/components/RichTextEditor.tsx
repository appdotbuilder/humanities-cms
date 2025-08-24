import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image,
  Video,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

import { MediaPicker } from '@/components/MediaPicker';
import type { Media } from '../../../server/src/schema';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertHTML = (html: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (div.firstChild) {
          fragment.appendChild(div.firstChild);
        }
        range.insertNode(fragment);
      } else {
        editorRef.current.innerHTML += html;
      }
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageSelect = (media: Media) => {
    const imageHTML = `
      <figure class="image-block my-4">
        <img 
          src="/uploads/${media.filename}" 
          alt="${media.alt_text || media.original_name}"
          class="max-w-full h-auto rounded-md shadow-sm border"
        />
        ${media.description ? `<figcaption class="text-sm text-gray-600 mt-2 text-center">${media.description}</figcaption>` : ''}
      </figure>
    `;
    insertHTML(imageHTML);
    setShowMediaPicker(false);
  };

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      const linkHTML = `<a href="${linkUrl}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      insertHTML(linkHTML);
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  const handleInsertVideo = () => {
    if (videoUrl) {
      let embedHTML = '';
      
      // YouTube embed
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        let videoId = '';
        if (videoUrl.includes('youtube.com')) {
          videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
        } else if (videoUrl.includes('youtu.be')) {
          videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
        }
        
        if (videoId) {
          embedHTML = `
            <div class="video-embed my-6">
              <div class="relative w-full" style="padding-bottom: 56.25%;">
                <iframe 
                  src="https://www.youtube.com/embed/${videoId}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                  class="absolute top-0 left-0 w-full h-full rounded-md shadow-sm"
                ></iframe>
              </div>
            </div>
          `;
        }
      }
      
      if (embedHTML) {
        insertHTML(embedHTML);
        setVideoUrl('');
        setShowVideoDialog(false);
      }
    }
  };

  const toolbarButtons = [
    { icon: Heading1, command: 'formatBlock', value: 'h1', tooltip: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', tooltip: 'Heading 3' },
    { icon: Type, command: 'formatBlock', value: 'p', tooltip: 'Paragraph' },
    null, // Separator
    { icon: Bold, command: 'bold', tooltip: 'Bold' },
    { icon: Italic, command: 'italic', tooltip: 'Italic' },
    { icon: Underline, command: 'underline', tooltip: 'Underline' },
    null, // Separator
    { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
    null, // Separator
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Blockquote' },
    { icon: Code, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
  ];

  if (showMediaPicker) {
    return (
      <MediaPicker
        onSelect={handleImageSelect}
        onClose={() => setShowMediaPicker(false)}
      />
    );
  }

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 bg-gray-50 border-b">
        {toolbarButtons.map((button, index) => 
          button === null ? (
            <Separator key={index} orientation="vertical" className="h-6 mx-1" />
          ) : (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => formatText(button.command, button.value)}
              title={button.tooltip}
            >
              <button.icon className="h-4 w-4" />
            </Button>
          )
        )}
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        {/* Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkDialog(true)}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        
        {/* Image Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMediaPicker(true)}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        
        {/* Video Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowVideoDialog(true)}
          title="Embed Video"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-96 p-4 prose prose-sm max-w-none focus:outline-none"
        style={{ 
          fontSize: '16px',
          lineHeight: '1.6'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={(e) => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
        }}
        onPaste={(e) => {
          // Handle paste events to clean up formatting
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link Text</label>
                <Input
                  value={linkText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkText(e.target.value)}
                  placeholder="Enter link text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <Input
                  value={linkUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInsertLink}>Insert</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Video Dialog */}
      {showVideoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Embed Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <Input
                  value={videoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a YouTube URL to embed the video
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVideoDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInsertVideo}>Embed</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Editor Styles */}
      <style>{`
        .prose h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        .prose h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        .prose h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        .prose p { margin: 0.75em 0; }
        .prose blockquote { 
          border-left: 4px solid #e5e7eb; 
          padding-left: 1rem; 
          margin: 1rem 0; 
          font-style: italic;
          color: #6b7280;
        }
        .prose pre { 
          background: #f3f4f6; 
          padding: 1rem; 
          border-radius: 0.375rem; 
          font-family: monospace; 
          margin: 1rem 0;
          white-space: pre-wrap;
        }
        .prose ul { list-style-type: disc; margin-left: 1.5rem; margin: 0.75em 0; }
        .prose ol { list-style-type: decimal; margin-left: 1.5rem; margin: 0.75em 0; }
        .prose li { margin: 0.25em 0; }
        .prose a { color: #2563eb; text-decoration: underline; }
        .image-block { text-align: center; }
        .video-embed { margin: 1.5rem 0; }
      `}</style>
    </div>
  );
}