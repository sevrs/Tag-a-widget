import { useState } from 'react';
import { Item, ItemRegistry, TagName, TagRegistry } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { TagChip } from './TagChip';
import { toast } from 'sonner@2.0.3';

interface ItemManagerProps {
  items: ItemRegistry;
  onItemsChange: (items: ItemRegistry) => void;
  tagRegistry: TagRegistry;
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
}

export function ItemManager({ 
  items, 
  onItemsChange, 
  tagRegistry, 
  selectedItems, 
  onSelectedItemsChange 
}: ItemManagerProps) {
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [editDialog, setEditDialog] = useState<{ 
    open: boolean; 
    item: Item | null; 
    name: string; 
    description: string; 
  }>({
    open: false,
    item: null,
    name: '',
    description: ''
  });
  const [tagDialog, setTagDialog] = useState<{
    open: boolean;
    itemIds: string[];
    tags: string;
    mode: 'add' | 'remove';
  }>({
    open: false,
    itemIds: [],
    tags: '',
    mode: 'add'
  });

  const itemList = Object.values(items).sort((a, b) => b.createdAt - a.createdAt);

  const handleAddItem = () => {
    const trimmedName = newItem.name.trim();
    if (!trimmedName) return;

    const item: Item = {
      id: Date.now().toString(),
      name: trimmedName,
      description: newItem.description.trim() || undefined,
      tags: [],
      createdAt: Date.now()
    };

    onItemsChange({
      ...items,
      [item.id]: item
    });

    setNewItem({ name: '', description: '' });
    toast.success('Item created');
  };

  const handleEditItem = () => {
    const { item, name, description } = editDialog;
    if (!item) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const updatedItem: Item = {
      ...item,
      name: trimmedName,
      description: description.trim() || undefined
    };

    onItemsChange({
      ...items,
      [item.id]: updatedItem
    });

    setEditDialog({ open: false, item: null, name: '', description: '' });
    toast.success('Item updated');
  };

  const handleDeleteItem = (itemId: string) => {
    const newItems = { ...items };
    delete newItems[itemId];
    onItemsChange(newItems);
    
    // Remove from selection if selected
    onSelectedItemsChange(selectedItems.filter(id => id !== itemId));
    toast.success('Item deleted');
  };

  const handleToggleSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectedItemsChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectedItemsChange([...selectedItems, itemId]);
    }
  };

  const handleBulkTagOperation = () => {
    const { itemIds, tags, mode } = tagDialog;
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (tagList.length === 0) {
      toast.error('Please specify tags');
      return;
    }

    const newItems = { ...items };
    let updatedCount = 0;

    itemIds.forEach(itemId => {
      const item = newItems[itemId];
      if (!item) return;

      if (mode === 'add') {
        const newTags = [...new Set([...item.tags, ...tagList])];
        newItems[itemId] = { ...item, tags: newTags };
      } else {
        const newTags = item.tags.filter(tag => !tagList.includes(tag));
        newItems[itemId] = { ...item, tags: newTags };
      }
      updatedCount++;
    });

    onItemsChange(newItems);
    setTagDialog({ open: false, itemIds: [], tags: '', mode: 'add' });
    
    const action = mode === 'add' ? 'tagged' : 'removed tags from';
    toast.success(`${action} ${updatedCount} item(s)`);
  };

  const handleRemoveTagFromItem = (itemId: string, tagToRemove: TagName) => {
    const item = items[itemId];
    if (!item) return;

    const newTags = item.tags.filter(tag => tag !== tagToRemove);
    onItemsChange({
      ...items,
      [itemId]: { ...item, tags: newTags }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Items ({itemList.length})
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <>
                <Dialog 
                  open={tagDialog.open && tagDialog.mode === 'add'} 
                  onOpenChange={(open) => setTagDialog({ 
                    ...tagDialog, 
                    open, 
                    itemIds: open ? selectedItems : [],
                    mode: 'add' 
                  })}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Tag className="h-4 w-4 mr-1" />
                      Add Tags
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tags to {selectedItems.length} Item(s)</DialogTitle>
                    </DialogHeader>
                    <div>
                      <Label htmlFor="add-tags">Tags (comma-separated):</Label>
                      <Textarea
                        id="add-tags"
                        value={tagDialog.tags}
                        onChange={(e) => setTagDialog({ ...tagDialog, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTagDialog({ ...tagDialog, open: false })}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkTagOperation}>Add Tags</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog 
                  open={tagDialog.open && tagDialog.mode === 'remove'} 
                  onOpenChange={(open) => setTagDialog({ 
                    ...tagDialog, 
                    open, 
                    itemIds: open ? selectedItems : [],
                    mode: 'remove' 
                  })}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Remove Tags
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Tags from {selectedItems.length} Item(s)</DialogTitle>
                    </DialogHeader>
                    <div>
                      <Label htmlFor="remove-tags">Tags to remove (comma-separated):</Label>
                      <Textarea
                        id="remove-tags"
                        value={tagDialog.tags}
                        onChange={(e) => setTagDialog({ ...tagDialog, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTagDialog({ ...tagDialog, open: false })}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkTagOperation}>Remove Tags</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new item */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1"
            />
            <Button onClick={handleAddItem} disabled={!newItem.name.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Description (optional)"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
        </div>

        {/* Selection info */}
        {selectedItems.length > 0 && (
          <div className="p-2 bg-accent rounded-lg">
            <p className="text-sm">
              {selectedItems.length} item(s) selected
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectedItemsChange([])}
                className="ml-2"
              >
                Clear selection
              </Button>
            </p>
          </div>
        )}

        {/* Item list */}
        <div className="space-y-2">
          {itemList.length === 0 ? (
            <p className="text-muted-foreground text-sm">No items created yet</p>
          ) : (
            <div className="space-y-2">
              {itemList.map(item => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-lg border bg-card cursor-pointer transition-colors ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleToggleSelection(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map(tag => (
                            <TagChip
                              key={tag}
                              tag={tag}
                              meta={tagRegistry[tag]}
                              variant="removable"
                              size="sm"
                              onRemove={() => handleRemoveTagFromItem(item.id, tag)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Dialog 
                        open={editDialog.open && editDialog.item?.id === item.id} 
                        onOpenChange={(open) => setEditDialog({ 
                          open, 
                          item: open ? item : null, 
                          name: open ? item.name : '', 
                          description: open ? (item.description || '') : '' 
                        })}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Item</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-name">Name:</Label>
                              <Input
                                id="edit-name"
                                value={editDialog.name}
                                onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description:</Label>
                              <Textarea
                                id="edit-description"
                                value={editDialog.description}
                                onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null, name: '', description: '' })}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditItem}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}