"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LEVEL_LABELS, XP_PER_LEVEL } from "@/types/domain";
import type { BadgeId, StudentProfile } from "@/types/domain";

const BADGE_META: Record<BadgeId, { label: string; description: string }> = {
  first_mastery:      { label: "Primeiro passo",     description: "Dominou o primeiro conceito" },
  streak_3:           { label: "Em sequência",        description: "3 acertos consecutivos" },
  mastered_afim:      { label: "Função afim",         description: "Dominou função afim" },
  mastered_quadratic: { label: "Função quadrática",   description: "Dominou função quadrática" },
  mastered_all:       { label: "Completo",            description: "Dominou todos os conceitos" },
  no_hints:           { label: "Sem dicas",           description: "Dominou um conceito sem hints" },
  comeback:           { label: "Retomada",            description: "Recuperou após retrocesso" },
};

const ALL_BADGES = Object.keys(BADGE_META) as BadgeId[];

interface ProgressPanelProps {
  profile: StudentProfile;
  lastXpGain: number | null;
  onXpGainShown: () => void;
}

export function ProgressPanel({ profile, lastXpGain, onXpGainShown }: ProgressPanelProps) {
  const currentLevel = profile.level;
  const xpCurrent = profile.xp - XP_PER_LEVEL[currentLevel - 1];
  const xpNeeded = (XP_PER_LEVEL[currentLevel] ?? XP_PER_LEVEL[4]) - XP_PER_LEVEL[currentLevel - 1];
  const xpProgress = Math.min(100, (xpCurrent / xpNeeded) * 100);
  const masteredCount = Object.values(profile.concepts).filter(
    (c) => c.status === "dominado"
  ).length;

  // Controla visibilidade do label +N XP
  const [gainVisible, setGainVisible] = useState(false);
  const [displayedGain, setDisplayedGain] = useState<number>(0);

  useEffect(() => {
    if (!lastXpGain) return;
    setDisplayedGain(lastXpGain);
    setGainVisible(true);
    const hide = setTimeout(() => {
      setGainVisible(false);
      onXpGainShown();
    }, 2000);
    return () => clearTimeout(hide);
  }, [lastXpGain]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-3 py-3 space-y-4 border-t border-border">
      {/* XP + Nível */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">
              {LEVEL_LABELS[currentLevel] ?? "Especialista"}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground/40 cursor-help select-none">?</span>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6} className="text-xs w-[280px] p-3">
                <p className="font-medium mb-2">Sistema de pontuação</p>
                <div className="space-y-1 text-muted-foreground">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5">
                    <span>Acerto direto</span><span className="text-primary tabular-nums">+20 pts</span><span className="text-primary tabular-nums">+10 XP</span>
                    <span>Com dica 1</span>    <span className="text-primary tabular-nums">+12 pts</span><span className="text-primary tabular-nums">+10 XP</span>
                    <span>Com dica 2</span>    <span className="text-primary tabular-nums">+6 pts</span> <span className="text-primary tabular-nums">+10 XP</span>
                    <span>Com dica 3</span>    <span className="text-primary tabular-nums">+2 pts</span> <span className="text-primary tabular-nums">+10 XP</span>
                    <span>Erro</span>          <span className="text-destructive tabular-nums">−10 pts</span><span className="tabular-nums">—</span>
                  </div>
                  <div className="border-t border-border/50 mt-1.5 pt-1.5 text-foreground/80">
                    Domínio (≥80 pts + 3 acertos consecutivos) — <span className="text-primary">+50 XP</span> bônus
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-medium transition-opacity duration-500"
              style={{
                color: "#22C55E",
                opacity: gainVisible ? 1 : 0,
                transform: gainVisible ? "translateY(0)" : "translateY(2px)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              +{displayedGain} XP
            </span>
            <span className="text-muted-foreground">{profile.xp} XP</span>
          </div>
        </div>
        <Progress value={xpProgress} className="h-1.5" />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{masteredCount}/12 dominados</span>
        <span>Nível {currentLevel}</span>
      </div>

      {/* Badges */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Conquistas</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BADGES.map((id) => {
            const earned = profile.badges.includes(id);
            const meta = BADGE_META[id];
            return (
              <Tooltip key={id}>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className={
                      earned
                        ? "border-primary/40 text-primary bg-primary/5 text-[10px] cursor-default"
                        : "border-border text-muted-foreground/30 text-[10px] cursor-default"
                    }
                  >
                    {meta.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[180px]">
                  {earned ? meta.description : "Ainda não conquistado"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
