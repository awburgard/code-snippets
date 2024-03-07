import React, { useCallback, useEffect, useMemo, useState } from "react";

export enum TreeItemTypeEnum {
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Object = "object",
  Array = "array",
  Null = "null",
  Undefined = "undefined",
  Function = "function",
  Symbol = "symbol",
  BigInt = "bigint",
  Date = "date",
  RegExp = "regexp",
  Error = "error",
  Unknown = "unknown",
  Circular = "circular",
  Integer = "integer",
  Float = "float",
  Image = "image",
}

export interface TreeNode {
  type: TreeItemTypeEnum;
  key: string;
  id: string;
  value: {
    format: {
      truncated: string | null;
      raw: string | null;
    };
    raw: unknown;
  };
  children: TreeNode[] | null;
}

export type GetType<TType extends TreeItemTypeEnum> =
  TType extends TreeItemTypeEnum.String
    ? string
    : TType extends TreeItemTypeEnum.Number
      ? number
      : TType extends TreeItemTypeEnum.Boolean
        ? boolean
        : TType extends TreeItemTypeEnum.Object
          ? object
          : TType extends TreeItemTypeEnum.Array
            ? unknown[]
            : TType extends TreeItemTypeEnum.Null
              ? null
              : TType extends TreeItemTypeEnum.Undefined
                ? undefined
                : TType extends TreeItemTypeEnum.Function
                  ? Function
                  : TType extends TreeItemTypeEnum.Symbol
                    ? symbol
                    : TType extends TreeItemTypeEnum.BigInt
                      ? bigint
                      : TType extends TreeItemTypeEnum.Date
                        ? Date
                        : TType extends TreeItemTypeEnum.RegExp
                          ? RegExp
                          : TType extends TreeItemTypeEnum.Error
                            ? Error
                            : TType extends TreeItemTypeEnum.Unknown
                              ? string
                              : TType extends TreeItemTypeEnum.Circular
                                ? string
                                : TType extends TreeItemTypeEnum.Integer
                                  ? number
                                  : TType extends TreeItemTypeEnum.Float
                                    ? number
                                    : never;

export type ExecutionResult<TType extends TreeItemTypeEnum = TreeItemTypeEnum> =
  {
    type: TType;
    formattedValue: GetType<TType>;
  };


type NodePathCache = Map<string, string[] | null>;
type Node = TreeNode | TreeNode[] | null;
type GetIdsResult = { label: string; value: string }[];
type FindNodePath = (
  nodeId: string,
  nodes: Node,
  path?: string[],
  cache?: NodePathCache,
) => string[] | null;
type FindNodeById = (id: string, nodes: Node) => TreeNode | null;
type HandleSearchAndExpand = (
  value: string,
  setExpandedCallback: (ids: string[]) => void,
  onHandleSearchCallback: ((value: string) => void) | undefined,
) => void;
type HandleNodeSelectFunction = (
  node: Node,
  nodeId: string,
  expanded: string[],
  setExpanded: (ids: string[]) => void,
  onHandleSearchCallback?: (nodeId: string) => void,
) => void;

interface UseDataTreeProps {
  treeData: unknown;
  onHandleSearchCallback?: (value: string) => void;
  onInitialLoadCallback?: () => void;
}
const getIds = (node: Node): GetIdsResult => {
  const result: GetIdsResult = [];

  if (!node) {
    return result;
  }

  // Use a stack for iterative DFS
  const stack: TreeNode[] = Array.isArray(node) ? [...node] : [node];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current) {
      result.push({ label: current.id, value: current.id });

      // Add children to the stack in reverse order for correct processing
      if (Array.isArray(current.children)) {
        stack.push(...current.children.slice().reverse());
      }
    }
  }

  return result;
};

const findNodePathImpl: FindNodePath = (
  nodeId,
  nodes,
  path = [],
  cache = new Map(),
) => {
  if (!nodes) {
    return null;
  }

  // Initialize a stack with the root nodes
  const stack: { node: TreeNode; path: string[] }[] = Array.isArray(nodes)
    ? nodes.map((node) => ({ node, path }))
    : [{ node: nodes, path }];

  while (stack.length > 0) {
    const { node, path } = stack.pop()!;

    const cacheKey = `${node.id}-${path.join(".")}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) ?? null;
    }

    // Check if the current node is the one we're looking for
    if (node.id === nodeId) {
      const result = [...path, node.id];
      cache.set(cacheKey, result);
      return result;
    }

    // If not, add the node's children to the stack
    if (node.children) {
      for (const childNode of node.children) {
        stack.push({ node: childNode, path: [...path, node.id] });
      }
    }

    // Cache the result as null if the node has no children
    cache.set(cacheKey, null);
  }

  return null;
};

const findNodeByIdImpl: FindNodeById = (id, nodes) => {
  if (!nodes) {
    return null;
  }

  const stack = Array.isArray(nodes) ? [...nodes] : [nodes];

  while (stack.length > 0) {
    const currentNode = stack.pop();

    if (!currentNode) {
      continue;
    }

    if (currentNode.id === id) {
      return currentNode;
    }
    if (currentNode.children) {
      stack.push(...currentNode.children);
    }
  }

  return null;
};

const handleSearchAndExpandImpl: HandleSearchAndExpand = (
  value,
  setExpandedCallback,
  onHandleSearchCallback,
) => {
  onHandleSearchCallback?.(value);

  if (value === "") {
    setExpandedCallback([]);
    return;
  }

  const valueArray = value.split(".");
  const expandedIds = valueArray.reduce<string[]>((acc, current, index) => {
    if (index === 0) {
      return [current];
    }
    acc.push(`${acc[index - 1]}.${current}`);
    return acc;
  }, []);

  setExpandedCallback(expandedIds);
};

const handleNodeSelectImpl: HandleNodeSelectFunction = (
  node,
  nodeId,
  expanded,
  setExpanded,
  onHandleSearchCallback,
) => {
  const isNodeExpanded = expanded.includes(nodeId);
  let newExpandedIds;

  if (isNodeExpanded) {
    // Convert expanded to a Set for O(1) lookup time
    const expandedSet = new Set(expanded);
    // Remove the nodeId from the expanded set
    expandedSet.delete(nodeId);
    // Remove all children of the nodeId as they are no longer visible
    const nodeToRemove = findNodeByIdImpl(nodeId, node);
    if (nodeToRemove && nodeToRemove.children) {
      nodeToRemove.children.forEach((child) => expandedSet.delete(child.id));
    }
    // Convert back to an array
    newExpandedIds = Array.from(expandedSet);
  } else {
    // Use a Set to ensure unique IDs and to benefit from faster add operation
    const newExpandedSet = new Set(expanded);
    const nodeToExpand = findNodeByIdImpl(nodeId, node);
    if (nodeToExpand) {
      // Add the nodeId and all its children to the expanded set
      newExpandedSet.add(nodeId);
      if (nodeToExpand.children) {
        nodeToExpand.children.forEach((child) => newExpandedSet.add(child.id));
      }
    }
    // Convert back to an array
    newExpandedIds = Array.from(newExpandedSet);
  }

  setExpanded(newExpandedIds);
  onHandleSearchCallback?.(nodeId);
};

const getChildAndGrandchildIdsOfNode = (tree: Node): string[] => {
  const result = new Set<string>(); // Use a set to store unique child IDs

  if (!tree || !Array.isArray(tree)) {
    // If the tree is null or not an array, return an empty array
    return [];
  }

  for (const child of tree) {
    // Iterate through each child of the tree
    if (!child || !Array.isArray(child.children)) {
      // If the child is null or its children are not an array, skip to the next child
      continue;
    }

    for (const grandchild of child.children) {
      // Iterate through each grandchild of the current child
      if (grandchild && grandchild.type === TreeItemTypeEnum.Object) {
        // If the grandchild exists and is an object, add its ID to the result set
        result.add(grandchild.id);
      }
    }
    result.add(child.id); // Add the current child's ID to the result set
  }

  return Array.from(result); // Convert the set to an array and return it
};

const useDataTree = ({
  treeData,
  onHandleSearchCallback,
  onInitialLoadCallback,
}: UseDataTreeProps) => {
  const [allExpanded, setAllExpanded] = useState<Boolean | undefined>(
    undefined,
  );

  const [expanded, setExpandedBase] = useState<string[]>([]);

  const setExpanded = useCallback(
    (ids: string[]) => {
      setAllExpanded(undefined);
      setExpandedBase(ids);
    },
    [setExpandedBase],
  );

  const tree = useMemo(() => createRenderTree({ data: treeData }), [treeData]);

  const nodeIds = useMemo(() => getIds(tree), [tree]);

  const firstLevelChildIds = useMemo(
    () => getChildAndGrandchildIdsOfNode(tree),
    [tree],
  );

  const findNodePath: FindNodePath = useCallback(
    (nodeId, nodes, path, cache) =>
      findNodePathImpl(nodeId, nodes, path, cache),
    [],
  );

  const handleSearchAndExpand = useCallback(
    (value: string) => {
      setAllExpanded(undefined);
      handleSearchAndExpandImpl(value, setExpanded, onHandleSearchCallback);
    },
    [onHandleSearchCallback, setExpanded],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      handleNodeSelectImpl(
        tree,
        nodeId,
        expanded,
        setExpanded,
        onHandleSearchCallback,
      );
    },
    [expanded, onHandleSearchCallback, setExpanded, tree],
  );

  const handleOnCollapseAll = useCallback(() => {
    setExpanded([nodeIds[0].label]);
    setAllExpanded(false);
  }, [nodeIds, setExpanded]);

  const handleOnExpandAll = useCallback(() => {
    setExpanded(firstLevelChildIds);
    setAllExpanded(true);
  }, [firstLevelChildIds, setExpanded]);

  useEffect(() => {
    if (nodeIds.length) {
      setExpanded([nodeIds[0].label]);
    }

    onInitialLoadCallback?.();
  }, [nodeIds, onInitialLoadCallback, setExpanded]);

  return {
    allExpanded,
    tree,
    expanded,
    setExpanded,
    findNodePath,
    handleSearchAndExpand,
    onCollapseAll: handleOnCollapseAll,
    onExpandAll: handleOnExpandAll,
    handleNodeSelect,
    nodeIds,
  };
};

import toPath from "lodash/toPath";

import { TreeItemTypeEnum, TreeNode } from "@/ui/Tree/types";

export interface CreateRenderTreeProps {
  initialPathName?: string;
  data: unknown;
  parentPath?: string[];
  visited?: WeakMap<object, boolean>;
}

export const createRenderTree = ({
  data,
  parentPath = [],
  visited = new WeakMap(),
}: CreateRenderTreeProps): TreeNode[] | TreeNode | null => {
  const type = getType(data);

  if (type !== TreeItemTypeEnum.Object && type !== TreeItemTypeEnum.Array) {
    return {
      type,
      key: parentPath[parentPath.length - 1],
      id: toPath(parentPath).join("."),
      value: { format: formatValueForDisplay(data, type), raw: data },
      children: null,
    };
  }

  if (visited.has(data as object)) {
    return {
      type: TreeItemTypeEnum.Circular,
      key: "Circular",
      id: toPath([...parentPath, "Circular"]).join("."),
      value: {
        format: {
          truncated: "[Circular Reference]",
          raw: "[Circular Reference]",
        },
        raw: data,
      },
      children: null,
    };
  }

  visited.set(data as object, true);

  // Optimization: Avoid creating new arrays on each recursive call
  const currentPath = parentPath.slice();
  currentPath.push("");

  const children: TreeNode[] = [];

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    currentPath[currentPath.length - 1] = key;
    const childNode = createRenderTree({
      data: value,
      parentPath: currentPath,
      visited,
    });

    if (childNode) {
      if (Array.isArray(childNode)) {
        children.push(...childNode);
      } else {
        children.push(childNode);
      }
    }
  }

  if (parentPath.length === 0) {
    return children.length > 0 ? children : null;
  }

  // For non-root nodes, return a TreeNode with children.
  return {
    id: toPath(parentPath).join("."),
    key: parentPath[parentPath.length - 1],
    type,
    children: children.length > 0 ? children : null,
    value: {
      format: {
        truncated: null,
        raw: null,
      },
      raw: null,
    },
  };
};

const typeLookup: { [key: string]: TreeItemTypeEnum | null } = {
  undefined: TreeItemTypeEnum.Undefined,
  bigint: TreeItemTypeEnum.BigInt,
  boolean: TreeItemTypeEnum.Boolean,
  function: TreeItemTypeEnum.Function,
  number: null, // special case, handled separately
  string: null, // special case, handled separately
  symbol: TreeItemTypeEnum.Symbol,
  object: null, // placeholder, as 'object' needs special handling
};

export const getType = (value: unknown): TreeItemTypeEnum => {
  if (value === null) return TreeItemTypeEnum.Null;

  const valueType = typeof value;
  const typeEnum = typeLookup[valueType];

  // Handling special cases for 'number' and 'string'
  if (typeEnum === null) {
    if (valueType === "number") {
      return (value as number) % 1 === 0
        ? TreeItemTypeEnum.Integer
        : TreeItemTypeEnum.Float;
    }
    if (valueType === "string") {
      const val = value as string;
      if (val.startsWith("data:image/")) {
        // Handle encoded images
        return TreeItemTypeEnum.Image;
      } else if (/^\d+(\.\d+)?$/.test(val) && !isNaN(Number(value))) {
        // Refine number check:
        // - Use isNaN to validate numeric value
        // - Remove unnecessary comparisons to "Infinity" and "NaN"
        return TreeItemTypeEnum.Number;
      } else {
        return TreeItemTypeEnum.String;
      }
    }
    // Handling object-like structures
    if (Array.isArray(value)) return TreeItemTypeEnum.Array;
    if (value instanceof Date) return TreeItemTypeEnum.Date;
    if (value instanceof RegExp) return TreeItemTypeEnum.RegExp;
    if (value instanceof Error) return TreeItemTypeEnum.Error;

    return TreeItemTypeEnum.Object;
  }

  return typeEnum as TreeItemTypeEnum;
};

export const formatValueForDisplay = (
  value: unknown,
  type: TreeItemTypeEnum,
): { truncated: string | null; raw: string } => {
  switch (type) {
    case TreeItemTypeEnum.Date: {
      const stringValue = value instanceof Date ? value.toISOString() : "";
      return { truncated: null, raw: stringValue };
    }
    case TreeItemTypeEnum.Float: {
      const stringValue =
        typeof value === "number" ? value.toFixed(2) : "Invalid Number";
      return { truncated: null, raw: stringValue };
    }
    case TreeItemTypeEnum.Array:
    case TreeItemTypeEnum.Object: {
      const truncated = truncateStringIfNecessary({
        value: JSON.stringify(value),
      });
      // Optionally add handling for very large objects or arrays
      return {
        truncated: truncated.truncated ? truncated.value : null,
        raw: JSON.stringify(value),
      };
    }
    case TreeItemTypeEnum.Image: {
      return {
        truncated: null,
        raw: String(value),
      };
    }

    default: {
      const truncated = truncateStringIfNecessary({ value: String(value) });
      return {
        truncated: truncated.truncated ? truncated.value : null,
        raw: String(value),
      };
    }
  }
};

export const truncateStringIfNecessary = <TValue extends string | null>({
  value,
  truncationLength = 75,
}: {
  value: TValue;
  truncationLength?: number;
}): {
  value: TValue;
  truncated: boolean;
} => {
  if (!value) {
    return {
      value,
      truncated: false,
    };
  }

  if (value.length <= truncationLength) {
    return {
      value,
      truncated: false,
    };
  }

  return {
    value: `${value.substring(0, truncationLength)}...` as TValue,
    truncated: true,
  };
};


export default useDataTree;
