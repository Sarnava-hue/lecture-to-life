"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ConceptEdgeData, ConceptNodeData } from "@/types/study";

export interface ConceptMapProps {
  nodesData: ConceptNodeData[];
  edgesData: ConceptEdgeData[];
}

export default function ConceptMap({ nodesData, edgesData }: ConceptMapProps) {
  const nodes: Node[] = useMemo(
    () =>
      nodesData.map((node) => {
        const isRoot = node.kind === "root";
        const isBranch = node.kind === "branch";

        return {
          id: node.id,
          position: { x: node.x, y: node.y },
          data: { label: node.label },
          style: {
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: isRoot ? 700 : 600,
            border: isRoot
              ? "2px solid #4f46e5"
              : isBranch
                ? "1px solid #6366f1"
                : "1px solid #cbd5e1",
            background: isRoot
              ? "#4f46e5"
              : isBranch
                ? "#eef2ff"
                : "#ffffff",
            color: isRoot ? "#ffffff" : "#0f172a",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
          },
        };
      }),
    [nodesData]
  );

  const edges: Edge[] = useMemo(
    () =>
      edgesData.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: Boolean(edge.label),
        style: { stroke: "#6366f1", strokeWidth: 1.75 },
        labelStyle: { fontSize: 11, fill: "#475569", fontWeight: 500 },
      })),
    [edgesData]
  );

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border bg-muted/20">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}
