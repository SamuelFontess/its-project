"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeTypes,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { CONCEPTS, CONCEPT_IDS } from "@/lib/domain";
import { isUnlocked } from "@/lib/zpd";
import type { ConceptId, StudentConcepts } from "@/types/domain";

// ─── Paleta de status ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  active:   { bg: "#18181B", text: "#FAFAFA", border: "#18181B" },
  mastered: { bg: "#14532d", text: "#86efac", border: "#22c55e" },
  progress: { bg: "#E4E4E7", text: "#3F3F46", border: "#D4D4D8" },
  unseen:   { bg: "#F4F4F5", text: "#A1A1AA", border: "#E4E4E7" },
  blocked:  { bg: "#FAFAFA", text: "#D4D4D8", border: "#F4F4F5" },
};

function getStatus(
  id: ConceptId,
  concepts: StudentConcepts,
  activeId: ConceptId | null
): keyof typeof STATUS_STYLES {
  if (id === activeId) return "active";
  const s = concepts[id]?.status ?? "nao_visto";
  if (s === "dominado") return "mastered";
  if (s === "em_progresso") return "progress";
  if (isUnlocked(id, concepts)) return "unseen";
  return "blocked";
}

// ─── Custom Node ──────────────────────────────────────────────────────────────

interface NodeData {
  label: string;
  conceptId: ConceptId;
  status: string;
}

function ConceptNode({ data }: { data: NodeData }) {
  const style = STATUS_STYLES[data.status] ?? STATUS_STYLES.blocked;
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={{
          background: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          borderRadius: 4,
          padding: "7px 10px",
          width: 164,
          opacity: data.status === "blocked" ? 0.4 : 1,
          boxShadow:
            data.status === "active"
              ? "0 0 0 2px #18181B, 0 2px 8px rgba(0,0,0,0.12)"
              : "0 1px 3px rgba(0,0,0,0.06)",
          transition: "all 150ms ease",
          cursor: data.status === "blocked" || data.status === "active" ? "default" : "pointer",
          fontFamily: "inherit",
        }}
      >
        <div style={{ fontSize: 9, opacity: 0.45, marginBottom: 2 }}>
          {data.conceptId}
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.35 }}>{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

const NODE_TYPES: NodeTypes = { concept: ConceptNode };

// ─── Posições estáticas ───────────────────────────────────────────────────────

const NODE_POSITIONS: Record<ConceptId, { x: number; y: number }> = {
  C1:  { x: 200, y: 0   },
  C2:  { x: 200, y: 90  },
  C3:  { x: 200, y: 180 },
  C4:  { x: 200, y: 270 },
  C5:  { x: 200, y: 360 },
  C6:  { x: 50,  y: 450 },
  C7:  { x: 350, y: 450 },
  C8:  { x: 50,  y: 540 },
  C9:  { x: 350, y: 540 },
  C10: { x: 350, y: 630 },
  C11: { x: 200, y: 720 },
  C12: { x: 350, y: 720 },
};

// ─── Componente principal ────────────────────────────────────────────────────

interface ConceptGraphProps {
  concepts: StudentConcepts;
  activeConceptId: ConceptId | null;
  onNodeClick: (conceptId: ConceptId) => void;
}

export function ConceptGraph({ concepts, activeConceptId, onNodeClick }: ConceptGraphProps) {
  const nodes: Node[] = useMemo(
    () =>
      CONCEPT_IDS.map((id) => {
        const status = getStatus(id, concepts, activeConceptId);
        return {
          id,
          type: "concept",
          position: NODE_POSITIONS[id],
          data: {
            label: CONCEPTS[id].name,
            conceptId: id,
            status,
          } satisfies NodeData,
          draggable: false,
          selectable: status !== "blocked",
        };
      }),
    [concepts, activeConceptId]
  );

  const edges: Edge[] = useMemo(
    () =>
      CONCEPT_IDS.flatMap((id) =>
        CONCEPTS[id].prerequisites.map((prereqId) => ({
          id: `${prereqId}-${id}`,
          source: prereqId,
          target: id,
          style: { stroke: "#D4D4D8", strokeWidth: 1 },
        }))
      ),
    []
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const id = node.id as ConceptId;
      const status = getStatus(id, concepts, activeConceptId);
      if (status !== "blocked" && status !== "active") {
        onNodeClick(id);
      }
    },
    [concepts, activeConceptId, onNodeClick]
  );

  return (
    <div style={{ width: "100%", height: "100%", background: "#FFFFFF" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        style={{ background: "#FFFFFF" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E4E4E7" gap={24} size={1} />
        <MiniMap
          nodeColor={(node) => {
            const id = node.id as ConceptId;
            const s = getStatus(id, concepts, activeConceptId);
            return STATUS_STYLES[s].bg;
          }}
          style={{ background: "#F4F4F5", border: "1px solid #E4E4E7" }}
          maskColor="rgba(255,255,255,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
