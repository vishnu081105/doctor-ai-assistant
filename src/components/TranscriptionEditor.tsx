import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Check, X, FileText } from 'lucide-react';
import { TemplateManager } from './TemplateManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TranscriptionEditorProps {
  transcription: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function TranscriptionEditor({ transcription, onSave, onCancel }: TranscriptionEditorProps) {
  const [editedText, setEditedText] = useState(transcription);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInsertTemplate = (content: string) => {
    const before = editedText.substring(0, cursorPosition);
    const after = editedText.substring(cursorPosition);
    setEditedText(before + content + ' ' + after);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextSelect = (e: React.FocusEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Edit Transcription</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} className="gap-1">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(editedText)} className="gap-1">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
        <CardDescription>
          Edit the transcription before generating your report
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor">
          <TabsList className="mb-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor">
            <Textarea
              value={editedText}
              onChange={handleTextChange}
              onSelect={handleTextSelect}
              onClick={handleTextSelect}
              onKeyUp={handleTextSelect}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Edit your transcription here..."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {editedText.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </TabsContent>
          
          <TabsContent value="templates">
            <TemplateManager 
              mode="select" 
              onInsertTemplate={handleInsertTemplate} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
