import { useState } from 'react';
import { TagName, TagRegistry, NodeRegistry } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Tag, Plus, Minus, Target } from 'lucide-react';
import { TagChip } from './TagChip';
import { toast } from 'sonner@2.0.3';

interface SelectionTaggerProps {
  nodes: NodeRegistry;
  onNodesChange: (nodes: NodeRegistry) => void;
  tagRegistry: TagRegistry;
  selectedNodeIds: string[];
  onSelectNodesWithTag?: (tagName: string) => void;
  onFocusNode?: (nodeId: string) => void;
}

export function SelectionTagger({ 
  nodes, 
  onNodesChange, 
  tagRegistry, 
  selectedNodeIds,
  onSelectNodesWithTag,
  onFocusNode
}: SelectionTaggerProps) {
  const [tagInput, setTagInput] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const selectedNodes = selectedNodeIds.map(id => nodes[id]).filter(Boolean);
  const allTagsOnSelection = new Set<TagName>();
  selectedNodes.forEach(node => {
    node.tags.forEach(tag => allTagsOnSelection.add(tag));
  });

  const handleBulkTagOperation = () => {
    if (selectedNodeIds.length === 0) {
      toast.error('No nodes selected');
      return;
    }

    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      toast.error('Please enter tags');
      return;
    }

    const newNodes = { ...nodes };
    let updatedCount = 0;

    selectedNodeIds.forEach(nodeId => {
      const node = newNodes[nodeId];
      if (!node) return;

      if (mode === 'add') {
        const newTags = [...new Set([...node.tags, ...tags])];
        newNodes[nodeId] = { ...node, tags: newTags };
      } else {
        const newTags = node.tags.filter(tag => !tags.includes(tag));
        newNodes[nodeId] = { ...node, tags: newTags };
      }
      updatedCount++;
    });

    onNodesChange(newNodes);
    setTagInput('');
    
    const action = mode === 'add' ? 'Tagged' : 'Removed tags from';
    toast.success(`${action} ${updatedCount} node(s)`);
  };

  const handleQuickTag = (tag: TagName) => {
    if (selectedNodeIds.length === 0) {
      toast.error('No nodes selected');
      return;
    }

    const newNodes = { ...nodes };
    let updatedCount = 0;

    selectedNodeIds.forEach(nodeId => {
      const node = newNodes[nodeId];
      if (!node) return;

      if (mode === 'add' && !node.tags.includes(tag)) {
        newNodes[nodeId] = { ...node, tags: [...node.tags, tag] };
        updatedCount++;
      } else if (mode === 'remove' && node.tags.includes(tag)) {
        newNodes[nodeId] = { ...node, tags: node.tags.filter(t => t !== tag) };
        updatedCount++;
      }
    });

    onNodesChange(newNodes);
    
    const action = mode === 'add' ? 'Tagged' : 'Removed tag from';
    toast.success(`${action} ${updatedCount} node(s)`);
  };

  const availableTags = Object.keys(tagRegistry).sort();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Selection Tagger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedNodeIds.length === 0 ? (
          <div className="text-center py-6 px-4 text-sm text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select nodes on the canvas to tag them</p>
          </div>
        ) : (
          <>
            {/* Selection summary */}
            <div className="p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {selectedNodeIds.length} node(s) selected
                </span>
                <div className="flex gap-1">
                  <Button
                    variant={mode === 'add' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('add')}
                    className="text-xs px-2 py-1"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant={mode === 'remove' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('remove')}
                    className="text-xs px-2 py-1"
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
              
              {allTagsOnSelection.size > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Current tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(allTagsOnSelection).sort().map(tag => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        meta={tagRegistry[String(tag)] || { color: '#6b7280', emoji: '' }}
                        size="sm"
                        variant="clickable"
                        onClick={() => mode === 'remove' && handleQuickTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tag input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Enter tags to ${mode} (comma-separated)`}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button 
                  onClick={handleBulkTagOperation}
                  disabled={!tagInput.trim()}
                  className="h-auto px-3"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick tag suggestions */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Click to {mode} tags:
                </p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableTags.slice(0, 12).map(tag => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      meta={tagRegistry[String(tag)] || { color: '#6b7280', emoji: '' }}
                      size="sm"
                      variant="clickable"
                      onClick={() => handleQuickTag(tag)}
                    />
                  ))}
                  {availableTags.length > 12 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{availableTags.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}