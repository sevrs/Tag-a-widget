import { TagRegistry, NodeRegistry } from '../types';

// Plugin-specific storage that communicates with the Figma plugin code
export class PluginStorageManager {
  private static messageCallbacks: { [key: string]: (data: any) => void } = {};
  
  static initialize() {
    // Set up message listener for plugin communication
    if (typeof window !== 'undefined' && window.pluginAPI) {
      window.pluginAPI.onMessage((message: any) => {
        console.log('UI received message:', message);
        
        switch (message.type) {
          case 'initial-data':
            if (this.messageCallbacks['initial-data']) {
              this.messageCallbacks['initial-data'](message);
            }
            break;
            
          case 'tag-registry':
          case 'tag-registry-updated':
            if (this.messageCallbacks['tag-registry']) {
              this.messageCallbacks['tag-registry'](message.registry);
            }
            break;
            
          case 'node-updated':
            if (this.messageCallbacks['node-updated']) {
              this.messageCallbacks['node-updated'](message.node);
            }
            break;
            
          case 'selection-changed':
            if (this.messageCallbacks['selection-changed']) {
              this.messageCallbacks['selection-changed'](message.selection);
            }
            break;
        }
      });
    }
  }
  
  static onMessage(type: string, callback: (data: any) => void) {
    this.messageCallbacks[type] = callback;
  }
  
  static postMessage(message: any) {
    if (typeof window !== 'undefined' && window.pluginAPI) {
      window.pluginAPI.postMessage(message);
    } else {
      console.warn('Plugin API not available, message not sent:', message);
    }
  }
  
  static async getTagRegistry(): Promise<TagRegistry> {
    return new Promise((resolve) => {
      this.onMessage('tag-registry', resolve);
      this.postMessage({ type: 'get-tag-registry' });
    });
  }
  
  static setTagRegistry(registry: TagRegistry): void {
    this.postMessage({ 
      type: 'set-tag-registry', 
      registry 
    });
  }
  
  static setNodeTags(nodeId: string, tags: string[]): void {
    this.postMessage({ 
      type: 'set-node-tags', 
      nodeId, 
      tags 
    });
  }
  
  static selectNodesWithTag(tagName: string): void {
    this.postMessage({ 
      type: 'select-nodes-with-tag', 
      tagName 
    });
  }
  
  static focusNode(nodeId: string): void {
    this.postMessage({ 
      type: 'focus-node', 
      nodeId 
    });
  }
  
  static closePlugin(): void {
    this.postMessage({ 
      type: 'close-plugin' 
    });
  }
  
  // For CSV export, we'll still use the local data
  static exportToCSV(nodes: NodeRegistry): string {
    const rows: string[] = ["nodeId,nodeName,nodeType,tags"];
    
    Object.values(nodes).forEach(node => {
      const name = node.name.replaceAll('"', '""');
      const tags = node.tags.join('|');
      rows.push(`"${node.id}","${name}","${node.type}","${tags}"`);
    });
    
    return rows.join('\n');
  }
}

// Extend window type for TypeScript
declare global {
  interface Window {
    pluginAPI?: {
      postMessage: (message: any) => void;
      onMessage: (callback: (message: any) => void) => void;
    };
  }
}