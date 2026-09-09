"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Bot, Check, ChevronRight, CircleHelp, Clapperboard,
  FileText, Gauge, LayoutDashboard, MoreHorizontal, Play, Plus, Radio,
  Search, Settings, ShieldCheck, Sparkles, WandSparkles, X, Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ApiMode, ContentItem, approveRemoteContent, demoDashboard, loadDashboard,
} from "@/lib/api";

const stageIcons = [
  Sparkles, Search, FileText, Clapperboard, Radio, WandSparkles, ShieldCheck, Play,
] as const;

const metricIcons = [Activity, ShieldCheck, Play, Gauge] as const;

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Conteúdos", icon: Clapperboard },
  { label: "Aprovações", icon: ShieldCheck, badge: "3" },
  { label: "Automações", icon: Zap },
  { label: "Provedores", icon: Bot },
] as const;

export default function Home() {
  const [activeNav, setActiveNav] = useState("Visão geral");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState(demoDashboard);
  const [apiMode, setApiMode] = useState<ApiMode>("demo");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadDashboard().then(({ snapshot, mode }) => {
      if (!active) return;
      setDashboard(snapshot);
      setApiMode(mode);
    });
    return () => {
      active = false;
    };
  }, []);

  const selected = dashboard.contents.find((item) => item.id === selectedId);
  const visibleContent = useMemo(
    () => dashboard.contents.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    ),
    [dashboard.contents, query],
  );

  const applyApproval = (approvedItem: ContentItem) => {
    setDashboard((current) => {
      const contents = current.contents.map((item) =>
        item.id === approvedItem.id ? approvedItem : item,
      );
      const pending = contents.filter(
        (item) => item.status === "Aguardando aprovação",
      ).length;
      return {
        ...current,
        contents,
        metrics: current.metrics.map((metric) =>
          metric.label === "Para aprovar"
            ? { ...metric, value: String(pending).padStart(2, "0") }
            : metric,
        ),
        stages: current.stages.map((stage) =>
          stage.name === "Revisão" ? { ...stage, value: pending } : stage,
        ),
      };
    });
  };

  const approve = async (id: number) => {
    setApprovingId(id);
    setActionError(null);
    try {
      const remote = await approveRemoteContent(id);
      const current = dashboard.contents.find((item) => item.id === id);
      if (!remote && current) {
        applyApproval({
          ...current,
          status: "Aprovado",
          stage: "Publicação",
          updated: "agora",
        });
      } else if (remote) {
        applyApproval(remote);
      }
      setSelectedId(null);
    } catch {
      setActionError("Não foi possível aprovar agora. Verifique a conexão com a API.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-white/[0.07]">
        <SidebarHeader className="px-3 py-4">
          <div className="flex h-10 items-center gap-3 overflow-hidden rounded-xl px-1.5">
            <div className="df-mark grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-black tracking-[-0.08em] text-black">DF</div>
            <div className="min-w-0 leading-none group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[15px] font-bold tracking-tight text-white">DarkFactory</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Control room</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Operação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={activeNav === item.label}
                      onClick={() => setActiveNav(item.label)}
                      className="h-10 rounded-xl text-zinc-400 hover:bg-white/[0.055] hover:text-white data-[active=true]:bg-orange-500/10 data-[active=true]:font-medium data-[active=true]:text-orange-400"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge && <span className="ml-auto rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{item.badge}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/[0.07] p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Configurações" onClick={() => setActiveNav("Configurações")} className="h-10 rounded-xl text-zinc-500 hover:bg-white/[0.055] hover:text-white">
                <Settings /><span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="João" className="mt-1 h-12 rounded-xl bg-white/[0.035] text-zinc-300">
                <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-800 text-[11px] font-bold text-orange-400">JS</div>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-medium text-zinc-200">João</span>
                  <span className="truncate text-[11px] text-zinc-600">Administrador</span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#090b0f]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.07] bg-[#090b0f]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <SidebarTrigger className="text-zinc-400 hover:bg-white/5 hover:text-white" />
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="text-zinc-600">Operação</span>
            <ChevronRight className="size-3.5 text-zinc-700" />
            <span className="font-medium text-zinc-300">{activeNav}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar conteúdo" placeholder="Buscar conteúdo..." className="h-9 w-60 rounded-lg border border-white/[0.08] bg-white/[0.035] pl-9 pr-12 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10" />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-600">⌘K</kbd>
            </label>
            <Button variant="ghost" size="icon-sm" aria-label="Ajuda" className="text-zinc-500 hover:bg-white/5 hover:text-zinc-200"><CircleHelp /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Notificações" className="relative text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
              <Bell /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-orange-500" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-orange-500">
                <span className="size-1.5 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316]" /> Operação ativa
                <span className="ml-1 rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[10px] tracking-[0.08em] text-zinc-500">
                  {apiMode === "connected" ? "API conectada" : apiMode === "offline" ? "API offline · dados locais" : "API preparada · dados locais"}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">Central de produção</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Acompanhe cada conteúdo da descoberta da pauta até a publicação.</p>
            </div>
            <Button className="h-10 rounded-xl bg-orange-500 px-4 font-semibold text-black shadow-[0_0_24px_rgba(249,115,22,0.18)] hover:bg-orange-400"><Plus />Novo conteúdo</Button>
          </section>

          <section aria-label="Resumo da operação" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard.metrics.map((metric, index) => {
              const MetricIcon = metricIcons[index] ?? Activity;
              return (
                <article key={metric.label} className="group rounded-2xl border border-white/[0.075] bg-[#101319] p-4 transition hover:border-white/[0.13] sm:p-5">
                  <div className="mb-5 flex items-center justify-between"><span className="text-sm text-zinc-500">{metric.label}</span><MetricIcon className="size-4 text-zinc-600 transition group-hover:text-orange-500" /></div>
                  <div className="flex items-end justify-between gap-3"><strong className="font-mono text-3xl font-semibold tracking-[-0.07em] text-zinc-100">{metric.value}</strong><span className="mb-1 text-xs text-zinc-600">{metric.note}</span></div>
                </article>
              );
            })}
          </section>

          <section className="mb-6 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#101319]">
            <div className="flex items-center justify-between border-b border-white/[0.065] px-5 py-4">
              <div><h2 className="font-semibold text-zinc-100">Pipeline editorial</h2><p className="mt-1 text-xs text-zinc-600">{dashboard.metrics[0]?.value ?? "0"} conteúdos distribuídos em {dashboard.stages.length} etapas</p></div>
              <Button variant="ghost" size="sm" className="text-zinc-500 hover:bg-white/5 hover:text-zinc-200">Ver fluxo<ChevronRight /></Button>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.055] sm:grid-cols-4 xl:grid-cols-8">
              {dashboard.stages.map((stage, index) => {
                const StageIcon = stageIcons[index] ?? Sparkles;
                return (
                  <button key={stage.name} className="group relative bg-[#101319] px-4 py-5 text-left transition hover:bg-[#151920]">
                    <div className={`stage-icon stage-${stage.color} mb-6 grid size-9 place-items-center rounded-xl`}><StageIcon className="size-4" /></div>
                    <p className="text-xs font-medium text-zinc-500">{String(index + 1).padStart(2, "0")} · {stage.name}</p>
                    <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-zinc-200">{stage.value}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.075] bg-[#101319]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.065] px-5 py-4">
                <div><h2 className="font-semibold text-zinc-100">Conteúdos recentes</h2><p className="mt-1 text-xs text-zinc-600">Prioridade definida por potencial de retenção</p></div>
                <Badge variant="outline" className="border-orange-500/20 bg-orange-500/[0.07] text-orange-400">{dashboard.metrics.find((metric) => metric.label === "Para aprovar")?.value ?? "0"} para revisar</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="h-11 px-5 text-xs font-medium text-zinc-600">Conteúdo</TableHead>
                    <TableHead className="hidden text-xs font-medium text-zinc-600 lg:table-cell">Etapa</TableHead>
                    <TableHead className="hidden text-xs font-medium text-zinc-600 sm:table-cell">Score</TableHead>
                    <TableHead className="pr-5 text-right text-xs font-medium text-zinc-600">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleContent.map((item) => {
                    const isApproved = item.status === "Aprovado";
                    return (
                      <TableRow key={item.id} className="border-white/[0.06] hover:bg-white/[0.025]">
                        <TableCell className="max-w-[410px] px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative hidden aspect-[9/16] h-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-zinc-700 via-zinc-900 to-black sm:block"><span className="absolute inset-x-0 bottom-0 h-1 bg-orange-500/70" /><Play className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-white/80" /></div>
                            <div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-200">{item.title}</p><p className="mt-1 text-xs text-zinc-600">{item.format} · {item.duration} · {item.updated}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell"><p className="text-sm text-zinc-400">{isApproved ? "Publicação" : item.stage}</p><p className="mt-1 text-xs text-zinc-600">{isApproved ? "Aprovado" : item.status}</p></TableCell>
                        <TableCell className="hidden sm:table-cell"><div className="flex items-center gap-2"><span className="font-mono text-sm font-semibold text-zinc-300">{item.score}</span><Progress value={item.score} className="h-1.5 w-16 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-orange-500" /></div></TableCell>
                        <TableCell className="pr-5 text-right">
                          {isApproved ? <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10"><Check />Aprovado</Badge> : <Button onClick={() => setSelectedId(item.id)} variant="outline" size="sm" className="border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white">Revisar</Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {visibleContent.length === 0 && <div className="px-5 py-12 text-center text-sm text-zinc-600">Nenhum conteúdo encontrado.</div>}
            </section>

            <aside className="rounded-2xl border border-white/[0.075] bg-[#101319]">
              <div className="flex items-center justify-between border-b border-white/[0.065] px-5 py-4">
                <div><h2 className="font-semibold text-zinc-100">Serviços</h2><p className="mt-1 text-xs text-zinc-600">{apiMode === "connected" ? "Atualização pela API" : "Aguardando hospedagem da API"}</p></div>
                <Button variant="ghost" size="icon-sm" aria-label="Mais opções" className="text-zinc-600 hover:bg-white/5 hover:text-zinc-300"><MoreHorizontal /></Button>
              </div>
              <div className="divide-y divide-white/[0.055] px-5">
                {dashboard.services.map((service) => (
                  <div key={service.name} className="flex items-center gap-3 py-4">
                    <span className={`size-2 rounded-full ${service.state === "Online" ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.5)]" : service.state === "Processando" ? "animate-pulse bg-amber-400" : "bg-red-400"}`} />
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-zinc-300">{service.name}</p><p className="mt-0.5 truncate text-xs text-zinc-600">{service.detail}</p></div>
                    <span className="text-xs text-zinc-600">{service.state}</span>
                  </div>
                ))}
              </div>
              <div className="m-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between text-xs"><span className="text-zinc-500">Render atual</span><span className="font-mono text-amber-400">{dashboard.render.progress}%</span></div>
                <Progress value={dashboard.render.progress} className="h-1.5 bg-white/[0.06] [&_[data-slot=progress-indicator]]:bg-amber-400" />
                <p className="mt-3 truncate text-xs text-zinc-600">{dashboard.render.filename}</p>
              </div>
            </aside>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="border-white/10 bg-[#11151b] text-zinc-100 shadow-2xl sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-orange-500"><ShieldCheck className="size-4" />Revisão humana</div>
                <DialogTitle className="pr-8 text-xl leading-7">{selected.title}</DialogTitle>
                <DialogDescription className="text-zinc-500">Confira os dados essenciais antes de liberar a publicação.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2 sm:grid-cols-2">
                {[["Formato", selected.format], ["Duração", selected.duration], ["Fonte", selected.source], ["Score de retenção", `${selected.score}/100`]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5"><p className="text-xs text-zinc-600">{label}</p><p className="mt-1 text-sm font-medium text-zinc-300">{value}</p></div>
                ))}
              </div>
              <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.055] p-4 text-sm leading-6 text-zinc-400">O conteúdo passou pela checagem automática de duração, legenda, volume e formato vertical. A aprovação humana continua obrigatória.</div>
              {actionError && <p role="alert" className="text-sm text-red-400">{actionError}</p>}
              <DialogFooter className="mt-2">
                <DialogClose asChild><Button variant="ghost" className="text-zinc-500 hover:bg-white/5 hover:text-white"><X />Voltar</Button></DialogClose>
                <Button disabled={approvingId === selected.id} onClick={() => approve(selected.id)} className="bg-orange-500 font-semibold text-black hover:bg-orange-400"><Check />{approvingId === selected.id ? "Aprovando..." : "Aprovar conteúdo"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
