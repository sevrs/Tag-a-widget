export type TagName = string;

export interface TagMeta {
  color?: string;
  emoji?: string;
}

export interface TagRegistry {
  [tag: TagName]: TagMeta;
}

export interface FigJamNode {
  id: string;
  name: string;
  type: 'sticky' | 'shape' | 'text' | 'connector' | 'widget' | 'frame';
  tags: TagName[];
  selected?: boolean;
}

export interface NodeRegistry {
  [id: string]: FigJamNode;
}

export interface FilterState {
  searchQuery: string;
  selectedTags: TagName[];
  showUntagged: boolean;
}

export interface PluginState {
  selectedNodeIds: string[];
  currentPage: string;
}