import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Copy } from 'lucide-react';
import { getAllTemplates, saveTemplate, deleteTemplate, Template, generateId } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

interface TemplateManagerProps {
  onInsertTemplate?: (content: string) => void;
  mode?: 'manage' | 'select';
}

export function TemplateManager({ onInsertTemplate, mode = 'manage' }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await getAllTemplates();
    setTemplates(data);
  };

  const handleSave = async () => {
    if (!newName.trim() || !newContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please enter a name and content for the template.',
      });
      return;
    }

    const template: Template = {
      id: generateId(),
      name: newName,
      content: newContent,
      category: newCategory || 'General',
      createdAt: new Date(),
    };

    await saveTemplate(template);
    await loadTemplates();
    setIsDialogOpen(false);
    setNewName('');
    setNewContent('');
    setNewCategory('');
    toast({ title: 'Template saved!' });
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    await loadTemplates();
    toast({ title: 'Template deleted' });
  };

  const handleInsert = (content: string) => {
    if (onInsertTemplate) {
      onInsertTemplate(content);
      toast({ title: 'Template inserted' });
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates</h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'select' ? 'Click to insert a template' : 'Save and reuse common phrases'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Save a reusable phrase or report structure
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard Assessment"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Physical Exam, History"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the template content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[300px]">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8" />
            <p>No templates yet</p>
            <p className="text-sm">Create your first template to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <Badge variant="secondary" className="mb-2">{category}</Badge>
                <div className="space-y-2">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="transition-colors hover:bg-secondary/50">
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{template.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {template.content.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {mode === 'select' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleInsert(template.content)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
