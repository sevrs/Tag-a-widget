// This plugin code runs in the Figma sandbox

// Plugin Data keys
const TAG_REGISTRY_KEY = 'tag-registry';
const NODE_TAGS_KEY = 'node-tags';

// Show the UI
figma.showUI(__html__, { 
  width: 384, 
  height: 600,
  themeColors: true 
});

// Handle messages from the UI
figma.ui.onmessage = (msg) => {
  console.log('Plugin received message:', msg);
  
  switch (msg.type) {
    case 'get-initial-data':
      handleGetInitialData();
      break;
      
    case 'get-selection':
      handleGetSelection();
      break;
      
    case 'set-node-tags':
      handleSetNodeTags(msg.nodeId, msg.tags);
      break;
      
    case 'get-tag-registry':
      handleGetTagRegistry();
      break;
      
    case 'set-tag-registry':
      handleSetTagRegistry(msg.registry);
      break;
      
    case 'select-nodes-with-tag':
      handleSelectNodesWithTag(msg.tagName);
      break;
      
    case 'focus-node':
      handleFocusNode(msg.nodeId);
      break;
      
    case 'close-plugin':
      figma.closePlugin();
      break;
      
    default:
      console.warn('Unknown message type:', msg.type);
  }
};

// Handle selection changes
figma.on('selectionchange', () => {
  handleGetSelection();
});

// Initialize plugin
function handleGetInitialData() {
  const tagRegistry = getTagRegistry();
  const nodes = getAllTaggedNodes();
  const selection = figma.currentPage.selection.map(node => node.id);
  
  figma.ui.postMessage({
    type: 'initial-data',
    tagRegistry,
    nodes,
    selection
  });
}

function handleGetSelection() {
  const selection = figma.currentPage.selection.map(node => node.id);
  figma.ui.postMessage({
    type: 'selection-changed',
    selection
  });
}

function handleSetNodeTags(nodeId: string, tags: string[]) {
  const node = figma.getNodeById(nodeId);
  if (!node) {
    console.warn('Node not found:', nodeId);
    return;
  }
  
  // Store tags in the node's plugin data
  node.setPluginData(NODE_TAGS_KEY, JSON.stringify(tags));
  
  // Send updated node data back to UI
  const nodeData = getNodeData(node);
  figma.ui.postMessage({
    type: 'node-updated',
    node: nodeData
  });
}

function handleGetTagRegistry() {
  const registry = getTagRegistry();
  figma.ui.postMessage({
    type: 'tag-registry',
    registry
  });
}

function handleSetTagRegistry(registry: any) {
  // Store the registry in the document's plugin data
  figma.root.setPluginData(TAG_REGISTRY_KEY, JSON.stringify(registry));
  
  figma.ui.postMessage({
    type: 'tag-registry-updated',
    registry
  });
}

function handleSelectNodesWithTag(tagName: string) {
  const nodesWithTag: SceneNode[] = [];
  
  // Find all nodes with the specified tag
  function findNodesWithTag(node: any) {
    if (node.type !== 'PAGE') {
      const tags = getNodeTags(node);
      if (tags.includes(tagName)) {
        nodesWithTag.push(node);
      }
    }
    
    if ('children' in node) {
      node.children.forEach(findNodesWithTag);
    }
  }
  
  figma.currentPage.children.forEach(findNodesWithTag);
  
  // Select the nodes
  figma.currentPage.selection = nodesWithTag;
  
  // Focus on the first node if any found
  if (nodesWithTag.length > 0) {
    figma.viewport.scrollAndZoomIntoView(nodesWithTag);
  }
}

function handleFocusNode(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (node && 'absoluteBoundingBox' in node) {
    figma.viewport.scrollAndZoomIntoView([node]);
    figma.currentPage.selection = [node];
  }
}

// Helper functions
function getTagRegistry() {
  const registryData = figma.root.getPluginData(TAG_REGISTRY_KEY);
  return registryData ? JSON.parse(registryData) : {};
}

function getNodeTags(node: any): string[] {
  const tagsData = node.getPluginData(NODE_TAGS_KEY);
  return tagsData ? JSON.parse(tagsData) : [];
}

function getNodeData(node: any) {
  return {
    id: node.id,
    name: node.name,
    type: getNodeType(node),
    tags: getNodeTags(node)
  };
}

function getNodeType(node: any): string {
  switch (node.type) {
    case 'STICKY':
      return 'sticky';
    case 'TEXT':
      return 'text';
    case 'FRAME':
    case 'GROUP':
      return 'frame';
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'POLYGON':
    case 'STAR':
    case 'VECTOR':
      return 'shape';
    default:
      return 'other';
  }
}

function getAllTaggedNodes() {
  const nodes: any = {};
  
  function scanNode(node: any) {
    if (node.type !== 'PAGE') {
      const tags = getNodeTags(node);
      if (tags.length > 0) {
        nodes[node.id] = getNodeData(node);
      }
    }
    
    if ('children' in node) {
      node.children.forEach(scanNode);
    }
  }
  
  figma.currentPage.children.forEach(scanNode);
  return nodes;
}

// Handle plugin command
if (figma.command === 'open-tagger') {
  // Plugin is already showing UI, just initialize
  handleGetInitialData();
}