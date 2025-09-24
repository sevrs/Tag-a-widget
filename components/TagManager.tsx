import { useState } from 'react';
import { TagName, TagMeta, TagRegistry } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, Edit2, Merge, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

interface TagManagerProps {
  registry: TagRegistry;
  onRegistryChange: (registry: TagRegistry) => void;
  onMergeTags?: (into: TagName, fromList: TagName[]) => void;
}

export function TagManager({ registry, onRegistryChange, onMergeTags }: TagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState('#9ca3af');
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; tag: TagName; newName: string }>({
    open: false,
    tag: '',
    newName: ''
  });
  const [mergeDialog, setMergeDialog] = useState<{ open: boolean; into: string; from: string }>({
    open: false,
    into: '',
    from: ''
  });

  const tags = Object.keys(registry).sort((a, b) => a.localeCompare(b));

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;
    
    if (registry[trimmedTag]) {
      toast.error('Tag already exists');
      return;
    }

    const meta: TagMeta = {};
    if (newEmoji.trim()) meta.emoji = newEmoji.trim();
    if (newColor !== '#9ca3af') meta.color = newColor;

    onRegistryChange({
      ...registry,
      [trimmedTag]: meta
    });

    setNewTag('');
    setNewEmoji('');
    setNewColor('#9ca3af');
    toast.success('Tag created');
  };

  const handleDeleteTag = (tag: TagName) => {
    const newRegistry = { ...registry };
    delete newRegistry[tag];
    onRegistryChange(newRegistry);
    toast.success('Tag deleted');
  };

  const handleRenameTag = () => {
    const { tag, newName } = renameDialog;
    const trimmedNewName = newName.trim();
    
    if (!trimmedNewName || trimmedNewName === tag) {
      setRenameDialog({ open: false, tag: '', newName: '' });
      return;
    }

    if (registry[trimmedNewName]) {
      toast.error('Tag with that name already exists');
      return;
    }

    const newRegistry = { ...registry };
    newRegistry[trimmedNewName] = newRegistry[tag];
    delete newRegistry[tag];
    onRegistryChange(newRegistry);
    
    setRenameDialog({ open: false, tag: '', newName: '' });
    toast.success('Tag renamed');
  };

  const handleMergeTags = () => {
    const { into, from } = mergeDialog;
    const intoTag = into.trim();
    const fromTags = from.split(',').map(t => t.trim()).filter(Boolean);

    if (!intoTag || fromTags.length === 0) {
      toast.error('Please specify tags to merge');
      return;
    }

    // Merge metadata
    const newRegistry = { ...registry };
    if (!newRegistry[intoTag]) {
      newRegistry[intoTag] = {};
    }

    fromTags.forEach(fromTag => {
      if (newRegistry[fromTag] && fromTag !== intoTag) {
        // Merge metadata (destination wins for conflicts)
        newRegistry[intoTag] = { ...newRegistry[fromTag], ...newRegistry[intoTag] };
        delete newRegistry[fromTag];
      }
    });

    onRegistryChange(newRegistry);
    onMergeTags?.(intoTag, fromTags);
    
    setMergeDialog({ open: false, into: '', from: '' });
    toast.success(`Merged tags into "${intoTag}"`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Tag Management
          <div className="flex gap-2">
            <Dialog open={mergeDialog.open} onOpenChange={(open) => setMergeDialog({ ...mergeDialog, open })}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Merge className="h-4 w-4 mr-1" />
                  Merge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Merge Tags</DialogTitle>
                  <DialogDescription>
                    Merge multiple tags into a single tag. All items with the source tags will be updated.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="merge-into">Merge into tag:</Label>
                    <Input
                      id="merge-into"
                      value={mergeDialog.into}
                      onChange={(e) => setMergeDialog({ ...mergeDialog, into: e.target.value })}
                      placeholder="Target tag name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merge-from">Tags to merge (comma-separated):</Label>
                    <Textarea
                      id="merge-from" 
                      value={mergeDialog.from}
                      onChange={(e) => setMergeDialog({ ...mergeDialog, from: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMergeDialog({ open: false, into: '', from: '' })}>
                    Cancel
                  </Button>
                  <Button onClick={handleMergeTags}>Merge Tags</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new tag */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Create a tag (e.g., Persona: Admin)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1"
            />
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <span>Optional:</span>
            <Input
              placeholder="emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-20"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
          </div>
        </div>

        {/* Tag list */}
        <div className="space-y-2">
          <h4>Tags ({tags.length})</h4>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tags created yet</p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => {
                const meta = registry[tag] || {};
                return (
                  <div key={tag} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                    <div
                      className="w-3 h-3 rounded-full bg-muted-foreground flex-shrink-0"
                      style={meta.color ? { backgroundColor: meta.color } : undefined}
                    />
                    <span className="flex-1">
                      {meta.emoji && <span className="mr-2">{meta.emoji}</span>}
                      {tag}
                    </span>
                    <div className="flex gap-1">
                      <Dialog 
                        open={renameDialog.open && renameDialog.tag === tag} 
                        onOpenChange={(open) => setRenameDialog({ 
                          open, 
                          tag: open ? tag : '', 
                          newName: open ? tag : '' 
                        })}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rename Tag</DialogTitle>
                          </DialogHeader>
                          <div>
                            <Label htmlFor="rename-input">New tag name:</Label>
                            <Input
                              id="rename-input"
                              value={renameDialog.newName}
                              onChange={(e) => setRenameDialog({ ...renameDialog, newName: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameTag()}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setRenameDialog({ open: false, tag: '', newName: '' })}>
                              Cancel
                            </Button>
                            <Button onClick={handleRenameTag}>Rename</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTag(tag)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}