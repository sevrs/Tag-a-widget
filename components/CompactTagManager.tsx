import { useState } from 'react';
import { TagName, TagMeta, TagRegistry, NodeRegistry } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Edit2, Plus, Settings, Search, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { TagChip } from './TagChip';
import { toast } from 'sonner@2.0.3';

interface CompactTagManagerProps {
  registry: TagRegistry;
  onRegistryChange: (registry: TagRegistry) => void;
  onMergeTags?: (into: TagName, fromList: TagName[]) => number;
  onSelectNodesWithTag?: (tagName: string) => void;
  nodes?: NodeRegistry;
}

export function CompactTagManager({ 
  registry, 
  onRegistryChange, 
  onMergeTags,
  onSelectNodesWithTag,
  nodes = {}
}: CompactTagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState('#9ca3af');
  const [isExpanded, setIsExpanded] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; tag: TagName; newName: string }>({
    open: false,
    tag: '',
    newName: ''
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

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Tag Management ({tags.length})
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
                {isExpanded ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Create new tag */}
            <div className="space-y-2">
              <div className="flex gap-1">
                <Input
                  placeholder="Tag name"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 text-sm"
                />
                <Input
                  placeholder="🏷️"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-12 text-sm text-center"
                />
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Button onClick={handleAddTag} disabled={!newTag.trim()} size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Tag list */}
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-4">
                No tags created yet
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {tags.map(tag => {
                  const meta = registry[tag] || {};
                  return (
                    <div key={tag} className="flex items-center gap-2 p-2 rounded border bg-card/50">
                      <div
                        className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0"
                        style={meta.color ? { backgroundColor: meta.color } : undefined}
                      />
                      <span className="flex-1 text-sm truncate">
                        {meta.emoji && <span className="mr-1">{meta.emoji}</span>}
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
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit2 className="h-2 w-2" />
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
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}