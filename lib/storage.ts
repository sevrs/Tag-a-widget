import { TagRegistry, NodeRegistry } from '../types';

const STORAGE_KEYS = {
  TAGS: 'figjam_tagger_tag_registry',
  NODES: 'figjam_tagger_node_registry',
} as const;

export class StorageManager {
  static getTagRegistry(): TagRegistry {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.TAGS);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  static setTagRegistry(registry: TagRegistry): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(registry));
  }

  static getNodeRegistry(): NodeRegistry {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.NODES);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  static setNodeRegistry(registry: NodeRegistry): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(registry));
  }

  static exportToCSV(): string {
    const nodes = this.getNodeRegistry();
    const rows: string[] = ["nodeId,nodeName,nodeType,tags"];
    
    Object.values(nodes).forEach(node => {
      const name = node.name.replaceAll('"', '""');
      const tags = node.tags.join('|');
      rows.push(`"${node.id}","${name}","${node.type}","${tags}"`);
    });
    
    return rows.join('\n');
  }
}