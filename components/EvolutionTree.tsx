"use client";

import { motion } from "framer-motion";
import { GitBranch, GitCommit, GitMerge, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

// 模拟从后端获取的演化数据
const evolutionData = [
  {
    id: "v1.0",
    version: "V1.0 主干",
    author: "System (Genesis)",
    avatar: "🤖",
    timestamp: "3天前",
    description: "初始化：基础的多语言翻译 Prompt 框架。",
    weight: 45,
    isMainline: true,
  },
  {
    id: "v1.1-fork",
    version: "V1.1 拉美市场分支",
    author: "@Carlos_Dev",
    avatar: "🧑‍💻",
    timestamp: "2天前",
    description: "Fork：注入了墨西哥本地电商俚语库和防幻觉约束指令。",
    weight: 82,
    isMainline: false,
    isEmerging: true, // 权重即将超越主干，触发涌现预警
  },
  {
    id: "v2.0-merge",
    version: "V2.0 新主干 (Emergence!)",
    author: "System Auto-Merge",
    avatar: "✨",
    timestamp: "1小时前",
    description: "Merge：社区实战验证权重超越 V1.0，系统自动将 @Carlos_Dev 的分支合并为新主干。",
    weight: 120,
    isMainline: true,
  },
];

export function EvolutionTree() {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl font-sans">
      <div className="flex items-center gap-2 mb-6 text-zinc-100">
        <GitBranch className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold tracking-tight">Knowledge Genealogy (演化树)</h3>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-800 before:via-zinc-700 before:to-transparent">
        {evolutionData.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5, ease: "easeOut" }}
            className="relative flex items-start gap-4 md:gap-6"
          >
            {/* 节点图标与连线 */}
            <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-zinc-800 bg-zinc-900 z-10 md:mx-auto shrink-0">
              {node.isEmerging ? (
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : node.isMainline ? (
                <GitMerge className="w-4 h-4 text-emerald-400" />
              ) : (
                <GitCommit className="w-4 h-4 text-blue-400" />
              )}
            </div>

            {/* 内容卡片 */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -2 }}
              className={cn(
                "flex-1 p-4 rounded-lg border transition-all duration-300",
                node.isMainline 
                  ? "bg-zinc-900/80 border-zinc-700 shadow-lg shadow-emerald-900/10" 
                  : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-600",
                node.isEmerging && "border-amber-500/50 shadow-lg shadow-amber-900/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{node.avatar}</span>
                  <span className="font-mono text-sm font-medium text-zinc-200">{node.version}</span>
                  {node.isEmerging && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                      Emerging
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{node.timestamp}</span>
              </div>
              
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">{node.description}</p>
              
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <User className="w-3 h-3" />
                  <span>{node.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Weight:</span>
                  <span className={cn(
                    "font-mono font-bold text-sm",
                    node.weight > 100 ? "text-emerald-400" : node.isEmerging ? "text-amber-400" : "text-zinc-300"
                  )}>
                    {node.weight.toFixed(1)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
