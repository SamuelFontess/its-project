"use client";

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
}

export function ProgressPanel({ profile }: ProgressPanelProps) {
  const currentLevel = profile.level;
  const xpCurrent = profile.xp - XP_PER_LEVEL[currentLevel - 1];
  const xpNeeded = (XP_PER_LEVEL[currentLevel] ?? XP_PER_LEVEL[4]) - XP_PER_LEVEL[currentLevel - 1];
  const xpProgress = Math.min(100, (xpCurrent / xpNeeded) * 100);
  const masteredCount = Object.values(profile.concepts).filter(
    (c) => c.status === "dominado"
  ).length;

  return (
    <div className="px-3 py-3 space-y-4 border-t border-border">
      {/* XP + Nível */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {LEVEL_LABELS[currentLevel] ?? "Especialista"}
          </span>
          <span className="text-muted-foreground">{profile.xp} XP</span>
        </div>
        <Progress value={xpProgress} className="h-px" />
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
