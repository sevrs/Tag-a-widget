import { useState, useEffect } from 'react';
import { TagRegistry, NodeRegistry, TagName } from './types';
import { PluginStorageManager } from './lib/plugin-storage';
import { CompactTagManager } from './components/CompactTagManager';
import { SelectionTagger } from './components/SelectionTagger';
import { PluginFooter } from './components/PluginFooter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Tag, Target, Plug } from 'lucide-react';
import { Toaster } from 'sonner@2.0.3';

export default function PluginApp() {
  const [tagRegistry, setTagRegistry] = useState<TagRegistry>({});
  const [nodes, setNodes] = useState<NodeRegistry>({});
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize plugin communication
  useEffect(() => {
    PluginStorageManager.initialize();
    
    // Listen for initial data from plugin
    PluginStorageManager.onMessage('initial-data', (data: any) => {
      console.log('Received initial data:', data);
      setTagRegistry(data.tagRegistry || {});
      setNodes(data.nodes || {});
      setSelectedNodeIds(data.selection || []);
      setIsConnected(true);
    });
    
    // Listen for selection changes
    PluginStorageManager.onMessage('selection-changed', (selection: string[]) => {
      setSelectedNodeIds(selection);
    });
    
    // Listen for tag registry updates
    PluginStorageManager.onMessage('tag-registry', (registry: TagRegistry) => {
      setTagRegistry(registry);
    });
    
    // Listen for node updates
    PluginStorageManager.onMessage('node-updated', (node: any) => {
      setNodes(prev => ({
        ...prev,
        [node.id]: node
      }));
    });
    
    // Request initial data
    PluginStorageManager.postMessage({ type: 'get-initial-data' });
  }, []);

  // Update tag registry in plugin when it changes
  const handleTagRegistryChange = (newRegistry: TagRegistry) => {
    setTagRegistry(newRegistry);
    PluginStorageManager.setTagRegistry(newRegistry);
  };

  // Update node tags in plugin when they change
  const handleNodesChange = (newNodes: NodeRegistry) => {
    // Find changed nodes and update them in the plugin
    Object.values(newNodes).forEach(node => {
      const oldNode = nodes[node.id];
      if (!oldNode || JSON.stringify(oldNode.tags) !== JSON.stringify(node.tags)) {
        PluginStorageManager.setNodeTags(node.id, node.tags);
      }
    });
    
    setNodes(newNodes);
  };

  const handleMergeTags = (into: TagName, fromList: TagName[]) => {
    const newNodes = { ...nodes };
    let updatedCount = 0;

    // Update all nodes that have any of the tags being merged
    Object.values(newNodes).forEach(node => {
      const hasAnyFromTag = fromList.some(tag => node.tags.includes(tag));
      if (hasAnyFromTag) {
        const newTags = new Set(node.tags);
        
        // Remove all "from" tags
        fromList.forEach(tag => newTags.delete(tag));
        
        // Add the "into" tag
        newTags.add(into);
        
        const updatedNode = {
          ...node,
          tags: Array.from(newTags).sort()
        };
        
        newNodes[node.id] = updatedNode;
        
        // Update in plugin
        PluginStorageManager.setNodeTags(node.id, updatedNode.tags);
        updatedCount++;
      }
    });

    setNodes(newNodes);
    return updatedCount;
  };

  const handleSelectNodesWithTag = (tagName: string) => {
    PluginStorageManager.selectNodesWithTag(tagName);
  };

  const handleFocusNode = (nodeId: string) => {
    PluginStorageManager.focusNode(nodeId);
  };

  const nodeCount = Object.keys(nodes).length;
  const tagCount = Object.keys(tagRegistry).length;
  const selectedCount = selectedNodeIds.length;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-sm mx-auto">
      {/* Plugin Header */}
      <div className="border-b bg-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">FigJam Tagger</h1>
            <p className="text-xs text-muted-foreground">
              Tag and organize your FigJam nodes
            </p>
          </div>
          <div 
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
            title={isConnected ? 'Connected' : 'Disconnected'} 
          />
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center gap-2 text-yellow-800 text-xs">
            <Plug className="h-3 w-3" />
            Connecting to FigJam...
          </div>
        </div>
      )}

      {/* Main Plugin Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tagger" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-3 mt-3">
            <TabsTrigger value="tagger" className="flex items-center gap-1 text-xs">
              <Target className="h-3 w-3" />
              Tagger
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-1 text-xs">
              <Tag className="h-3 w-3" />
              Manage
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="tagger" className="p-3 space-y-3 mt-0">
              <SelectionTagger
                nodes={nodes}
                onNodesChange={handleNodesChange}
                tagRegistry={tagRegistry}
                selectedNodeIds={selectedNodeIds}
                onSelectNodesWithTag={handleSelectNodesWithTag}
                onFocusNode={handleFocusNode}
              />
            </TabsContent>

            <TabsContent value="tags" className="p-3 space-y-3 mt-0">
              <CompactTagManager
                registry={tagRegistry}
                onRegistryChange={handleTagRegistryChange}
                onMergeTags={handleMergeTags}
                onSelectNodesWithTag={handleSelectNodesWithTag}
                nodes={nodes}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Plugin Footer */}
      <PluginFooter
        nodeCount={nodeCount}
        tagCount={tagCount}
        selectedCount={selectedCount}
        onExportCSV={() => {
          const csv = PluginStorageManager.exportToCSV(nodes);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'figjam-tags.csv';
          a.click();
          URL.revokeObjectURL(url);
        }}
      />

      {/* Welcome message for new users */}
      {isConnected && nodeCount === 0 && tagCount === 0 && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center">
          <div className="text-center p-6 max-w-xs">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Ready to Tag!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select some nodes in your FigJam file and start tagging them to organize your content.
            </p>
          </div>
        </div>
      )}
      
      <Toaster position="top-center" />
    </div>
  );
}