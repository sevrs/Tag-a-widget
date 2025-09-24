import { useState } from 'react';
import { FigJamNode, NodeRegistry, TagRegistry, TagName, TagMeta } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Square, Circle, Type, ArrowRight, FileText, Frame, Copy } from 'lucide-react';
import { TagChip } from './TagChip';
import { TagStyleEditor } from './TagStyleEditor';
import { toast } from 'sonner@2.0.3';

interface FigJamSimulatorProps {
  nodes: NodeRegistry;
  onNodesChange: (nodes: NodeRegistry) => void;
  selectedNodeIds: string[];
  onSelectedNodeIdsChange: (nodeIds: string[]) => void;
  tagRegistry: TagRegistry;
  onTagRegistryChange: (registry: TagRegistry) => void;
}

const NODE_ICONS = {
  sticky: FileText,
  shape: Square,
  text: Type,
  connector: ArrowRight,
  widget: Circle,
  frame: Frame
};

// Simulate some FigJam nodes
const DEMO_NODES: FigJamNode[] = [
  { id: '1', name: 'User Research Findings', type: 'sticky' as const, tags: [] },
  { id: '2', name: 'Problem Statement', type: 'text' as const, tags: [] },
  { id: '3', name: 'Solution Ideas', type: 'frame' as const, tags: [] },
  { id: '4', name: 'Key Insight', type: 'sticky' as const, tags: [] },
  { id: '5', name: 'Decision Point', type: 'shape' as const, tags: [] },
  { id: '6', name: 'Action Items', type: 'sticky' as const, tags: [] },
];

export function FigJamSimulator({ 
  nodes, 
  onNodesChange, 
  selectedNodeIds, 
  onSelectedNodeIdsChange,
  tagRegistry,
  onTagRegistryChange
}: FigJamSimulatorProps) {
  const [showSimulator, setShowSimulator] = useState(true);

  const nodeList = Object.values(nodes);

  const handleAddDemoNodes = () => {
    const newNodes = { ...nodes };
    DEMO_NODES.forEach(node => {
      if (!newNodes[node.id]) {
        newNodes[node.id] = node;
      }
    });
    onNodesChange(newNodes);
  };

  const handleToggleSelection = (nodeId: string) => {
    // Single selection mode - always select only the clicked node
    onSelectedNodeIdsChange([nodeId]);
  };

  const handleSelectAll = () => {
    onSelectedNodeIdsChange(nodeList.map(node => node.id));
  };

  const handleClearSelection = () => {
    onSelectedNodeIdsChange([]);
  };

  const handleCopyNodes = () => {
    if (selectedNodeIds.length === 0) return;
    
    const newNodes = { ...nodes };
    const copiedNodeIds: string[] = [];
    
    selectedNodeIds.forEach(nodeId => {
      const originalNode = nodes[nodeId];
      if (originalNode) {
        // Generate new ID
        const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create copied node with same tags
        const copiedNode: FigJamNode = {
          ...originalNode,
          id: newId,
          name: `${originalNode.name} (Copy)`,
          // Tags are copied as-is
        };
        
        newNodes[newId] = copiedNode;
        copiedNodeIds.push(newId);
      }
    });
    
    onNodesChange(newNodes);
    onSelectedNodeIdsChange(copiedNodeIds);
    toast.success(`Copied ${selectedNodeIds.length} node${selectedNodeIds.length !== 1 ? 's' : ''} with tags`);
  };

  const handleUpdateTag = (oldTag: TagName, newTag: TagName, meta: TagMeta) => {
    if (!oldTag || !newTag) return;
    
    // Update tag registry
    const newRegistry = { ...tagRegistry };
    
    if (oldTag !== newTag) {
      // Tag name changed - update all nodes that use this tag
      delete newRegistry[oldTag];
      newRegistry[newTag] = meta;
      
      const updatedNodes = { ...nodes };
      Object.values(updatedNodes).forEach(node => {
        if (node.tags && node.tags.includes(oldTag)) {
          const tagIndex = node.tags.indexOf(oldTag);
          const newTags = [...node.tags];
          newTags[tagIndex] = newTag;
          updatedNodes[node.id] = { ...node, tags: newTags };
        }
      });
      onNodesChange(updatedNodes);
    } else {
      // Just update metadata
      newRegistry[newTag] = meta;
    }
    
    onTagRegistryChange(newRegistry);
    toast.success(`Updated tag "${newTag}"`);
  };

  const handleDeleteTag = (tag: TagName) => {
    if (!tag) return;
    
    // Remove from registry
    const newRegistry = { ...tagRegistry };
    delete newRegistry[tag];
    onTagRegistryChange(newRegistry);
    
    // Remove from all nodes
    const updatedNodes = { ...nodes };
    Object.values(updatedNodes).forEach(node => {
      if (node.tags && node.tags.includes(tag)) {
        updatedNodes[node.id] = {
          ...node,
          tags: node.tags.filter(t => t !== tag)
        };
      }
    });
    onNodesChange(updatedNodes);
    toast.success(`Deleted tag "${tag}"`);
  };

  if (!showSimulator) {
    return (
      <div className="p-2 border-b bg-muted/30">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSimulator(true)}
          className="w-full justify-start text-xs"
        >
          Show FigJam Canvas Simulator
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            FigJam Canvas (Simulator)
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSimulator(false)}
            className="text-xs px-2 py-1 h-auto"
          >
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {nodeList.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No nodes on canvas</p>
            <Button onClick={handleAddDemoNodes} size="sm">
              Add Demo Nodes
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{nodeList.length} nodes on canvas</span>
              <div className="flex gap-1">
                {selectedNodeIds.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyNodes}
                    className="text-xs px-2 py-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
Copy Node
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSelection}
                  className="text-xs px-2 py-1"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4" style={{ background: 'linear-gradient(45deg, #f8f9fa 25%, transparent 25%), linear-gradient(-45deg, #f8f9fa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8f9fa 75%), linear-gradient(-45deg, transparent 75%, #f8f9fa 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }}>
              {nodeList.map(node => {
                const Icon = NODE_ICONS[node.type];
                const isSelected = selectedNodeIds.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className="relative"
                    onClick={() => handleToggleSelection(node.id)}
                  >
                    {/* Main Node */}
                    <div
                      className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[80px] flex flex-col justify-center ${
                        isSelected 
                          ? 'border-blue-400 shadow-lg transform scale-105' 
                          : 'border-gray-300 hover:border-gray-400 shadow-sm'
                      }`}
                      style={{
                        backgroundColor: node.type === 'sticky' ? '#fef08a' : 
                                       node.type === 'frame' ? '#e0e7ff' :
                                       node.type === 'shape' ? '#fce7f3' : '#ffffff'
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Icon className="h-3 w-3 flex-shrink-0 opacity-60" />
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1 py-0 opacity-60"
                        >
                          {node.type}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-gray-800 leading-tight">
                        {node.name}
                      </div>
                      
                      {/* Tag indicators on the right side */}
                      {node.tags.length > 0 && (
                        <div className="absolute -right-1 top-2 flex flex-col gap-1 z-10">
                          {node.tags.slice(0, 4).map((tag, index) => {
                            const tagMeta = tagRegistry[String(tag)] || { color: '#6b7280', emoji: '' };
                            return (
                              <TagStyleEditor
                                key={String(tag)}
                                tag={tag}
                                meta={tagMeta}
                                onUpdate={(newTag: TagName, meta: TagMeta) => handleUpdateTag(tag, newTag, meta)}
                                onDelete={handleDeleteTag}
                              >
                                <div
                                  className={`transition-all duration-300 ease-out cursor-pointer ${
                                    isSelected 
                                      ? 'rounded-full shadow-lg border px-3 py-1 flex items-center gap-1 whitespace-nowrap hover:shadow-xl' 
                                      : 'w-4 h-2 rounded-full border border-white shadow-sm hover:shadow-md'
                                  }`}
                                  style={{ 
                                    backgroundColor: String(tagMeta.color || '#9ca3af'),  // Solid color for both states
                                    borderColor: isSelected ? String(tagMeta.color || '#9ca3af') : 'white',
                                    borderWidth: '1px',
                                    animationDelay: isSelected ? `${index * 75}ms` : '0ms',
                                    transform: isSelected ? 'translateX(0)' : 'translateX(2px)'
                                  }}
                                  title={!isSelected ? `Click to edit "${tag}"` : undefined}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  {isSelected && (
                                    <>
                                      {tagMeta.emoji && (
                                        <span className="text-xs">{String(tagMeta.emoji)}</span>
                                      )}
                                      <span className="text-xs font-medium text-white">{String(tag)}</span>
                                    </>
                                  )}
                                </div>
                              </TagStyleEditor>
                            );
                          })}
                          {node.tags.length > 4 && (
                            <div
                              className={`transition-all duration-300 ease-out ${
                                isSelected 
                                  ? 'bg-white rounded-full shadow-lg border px-3 py-1 flex items-center gap-1' 
                                  : 'w-4 h-2 rounded-full border border-white shadow-sm bg-gray-400 flex items-center justify-center'
                              }`}
                              style={{
                                animationDelay: isSelected ? `${4 * 75}ms` : '0ms',
                                transform: isSelected ? 'translateX(0)' : 'translateX(2px)'
                              }}
                              title={!isSelected ? `+${node.tags.length - 4} more tags` : undefined}
                            >
                              {isSelected ? (
                                <span className="text-xs font-medium text-gray-600">
                                  +{node.tags.length - 4} more
                                </span>
                              ) : (
                                <span className="text-xs text-white font-bold leading-none">+</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedNodeIds.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-800">
Selected for tagging
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}