"use client";

import { Check, Loader2, Pencil, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  ACCESSORIES,
  ACCESSORY_COLORS,
  BODY_COLORS,
  BODY_SHAPES,
  EXPRESSIONS,
  MOTIONS,
  type TiniBodyShape,
  type TiniExpression,
  type TiniMotion,
} from "@/lib/tini/catalog";
import {
  DEFAULT_PROFILE,
  type TiniMood,
  poseForMood,
  setAccessoryColor,
  toggleAccessory,
} from "@/lib/tini/profile";
import { loadTiniChat, loadTiniProfile, saveTiniChat, saveTiniProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AiSource, TiniMessage, TiniProfile } from "@/types";
import { TiniCharacter } from "./tini-character";

const PERSONALITIES: { value: TiniProfile["personality"]; label: string }[] = [
  { value: "warm", label: "🤗 다정한" },
  { value: "realistic", label: "🧭 현실적인" },
  { value: "cheerful", label: "🎉 유쾌한" },
];
const STYLES: { value: TiniProfile["speechStyle"]; label: string }[] = [
  { value: "casual", label: "반말" },
  { value: "polite", label: "존댓말" },
];

export function TiniStudio() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loader2 className="mx-auto mt-10 animate-spin" />;
  return <TiniApp />;
}

function TiniApp() {
  const [profile, setProfile] = useState<TiniProfile | null>(() => loadTiniProfile());
  const [editing, setEditing] = useState(profile === null);

  if (editing || !profile) {
    return (
      <TiniEditor
        initial={profile ?? DEFAULT_PROFILE}
        onSave={(p) => {
          saveTiniProfile(p);
          setProfile(p);
          setEditing(false);
          toast.success(`${p.name} 저장 완료!`);
        }}
      />
    );
  }
  return <TiniChat profile={profile} onEdit={() => setEditing(true)} />;
}

/* ---------------- 공용 작은 부품 ---------------- */

function Swatches({
  colors,
  value,
  onChange,
  label,
}: {
  colors: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {colors.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={cn(
            "flex size-8 items-center justify-center rounded-full ring-1 ring-border transition",
            value === c.value && "ring-[3px] ring-primary"
          )}
          style={{ backgroundColor: c.value }}
        >
          {value === c.value && <Check className="size-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          variant={value === o.value ? "default" : "outline"}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

/* ---------------- 꾸미기 ---------------- */

function TiniEditor({ initial, onSave }: { initial: TiniProfile; onSave: (p: TiniProfile) => void }) {
  const [p, setP] = useState(initial);
  const [expression, setExpression] = useState<TiniExpression>("smile");
  const [motion, setMotion] = useState<TiniMotion>("float");
  const avatar = p.avatar;
  const setAvatar = (next: TiniProfile["avatar"]) => setP((prev) => ({ ...prev, avatar: next }));

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* 실시간 미리보기 */}
      <Card className="md:sticky md:top-20 md:self-start">
        <CardContent className="space-y-3">
          <div className="rounded-2xl bg-gradient-to-b from-secondary to-background p-4">
            <TiniCharacter
              avatar={avatar}
              expression={expression}
              motion={motion}
              className="mx-auto w-full max-w-[260px]"
              title={`${p.name} 미리보기`}
            />
          </div>
          <p className="text-center text-lg font-black">{p.name || "이름 없음"}</p>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">표정 미리보기</p>
            <Chips options={EXPRESSIONS.map((e) => ({ value: e.id, label: e.label }))} value={expression} onChange={setExpression} />
            <p className="text-xs font-semibold text-muted-foreground">움직임 미리보기</p>
            <Chips options={MOTIONS.map((m) => ({ value: m.id, label: m.label }))} value={motion} onChange={setMotion} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>나만의 MINI-TTINI 꾸미기</CardTitle>
          <CardDescription>몽글몽글 먼지 친구를 직접 꾸며요. 바꾸는 즉시 왼쪽에 적용돼요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs defaultValue="body">
            <TabsList className="w-full">
              <TabsTrigger value="body">몸</TabsTrigger>
              <TabsTrigger value="accessory">장신구</TabsTrigger>
              <TabsTrigger value="persona">성격</TabsTrigger>
            </TabsList>

            <TabsContent value="body" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>몸 모양</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BODY_SHAPES) as TiniBodyShape[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={avatar.body === id}
                      onClick={() => setAvatar({ ...avatar, body: id })}
                      className={cn(
                        "rounded-xl border p-2 text-xs font-medium transition hover:bg-secondary",
                        avatar.body === id && "border-primary bg-secondary ring-2 ring-primary/40"
                      )}
                    >
                      <TiniCharacter avatar={{ ...avatar, body: id, accessories: [] }} motion="none" className="mx-auto w-16" />
                      {BODY_SHAPES[id].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>몸 색</Label>
                <Swatches label="몸 색" colors={BODY_COLORS} value={avatar.bodyColor} onChange={(c) => setAvatar({ ...avatar, bodyColor: c })} />
              </div>
            </TabsContent>

            <TabsContent value="accessory" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">여러 개를 함께 착용할 수 있어요. 착용한 장신구는 색도 바꿀 수 있어요.</p>
              {ACCESSORIES.map((a) => {
                const on = avatar.accessories.includes(a.id);
                return (
                  <div key={a.id} className={cn("space-y-2 rounded-xl border p-3", on && "border-primary/50 bg-secondary/50")}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {a.icon} {a.label}
                      </span>
                      <Button
                        size="sm"
                        variant={on ? "default" : "outline"}
                        aria-pressed={on}
                        aria-label={`${a.label} ${on ? "벗기" : "착용"}`}
                        onClick={() => setAvatar(toggleAccessory(avatar, a.id))}
                      >
                        {on ? "착용 중" : "착용"}
                      </Button>
                    </div>
                    {on && (
                      <Swatches
                        label={`${a.label} 색`}
                        colors={ACCESSORY_COLORS}
                        value={avatar.accessoryColors[a.id]}
                        onChange={(c) => setAvatar(setAccessoryColor(avatar, a.id, c))}
                      />
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="persona" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tini-name">이름</Label>
                <Input id="tini-name" value={p.name} maxLength={20} onChange={(e) => setP({ ...p, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>성격</Label>
                <Chips options={PERSONALITIES} value={p.personality} onChange={(v) => setP({ ...p, personality: v })} />
              </div>
              <div className="space-y-2">
                <Label>말투</Label>
                <Chips options={STYLES} value={p.speechStyle} onChange={(v) => setP({ ...p, speechStyle: v })} />
              </div>
            </TabsContent>
          </Tabs>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!p.name.trim()) {
                toast.warning("이름을 지어 주세요.");
                return;
              }
              onSave({ ...p, name: p.name.trim() });
            }}
          >
            저장하고 대화하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- 상담 ---------------- */

/** 사용자의 말에서 티니가 보일 기분을 간단히 골라요. */
function moodFromText(text: string): TiniMood {
  if (/좋았|신나|합격|고마|행복|기뻐|성공|칭찬/.test(text)) return "happy";
  if (/힘들|우울|슬퍼|속상|외로|지쳐|울고|서운|걱정|불안/.test(text)) return "sad";
  if (/헐|대박|진짜\?|어떡해|깜짝/.test(text)) return "surprised";
  return "cheer";
}

function TiniChat({ profile, onEdit }: { profile: TiniProfile; onEdit: () => void }) {
  const [messages, setMessages] = useState<TiniMessage[]>(() => loadTiniChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<TiniMood>("idle");
  const [source, setSource] = useState<AiSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pose = poseForMood(loading ? "thinking" : mood);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  // AI 연결 상태 확인 (미연결이면 입력을 막고 안내)
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { source: AiSource }) => setSource(d.source))
      .catch(() => setSource("demo"));
  }, []);
  const offline = source === "demo";

  async function send() {
    const content = input.trim();
    if (!content || loading) return;
    const next: TiniMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { name: profile.name, personality: profile.personality, speechStyle: profile.speechStyle },
          messages: next.slice(-20),
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { reply: string | null; source: AiSource; fallbackReason?: string };
      if (!data.reply) {
        // 실제 AI 답이 없으면 꾸며 내지 않고 안내만
        setSource(data.source);
        toast.info(data.fallbackReason ?? "AI 응답이 없어요.");
        setMessages(messages);
        setInput(content);
        return;
      }
      const withReply: TiniMessage[] = [...next, { role: "tini", content: data.reply }];
      setMessages(withReply);
      setSource(data.source);
      setMood(moodFromText(content));
      saveTiniChat(withReply);
    } catch {
      toast.error(`${profile.name}의 답을 받지 못했어요.`);
      setMessages(messages);
      setInput(content);
      setMood("sad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center gap-4">
          <TiniCharacter
            avatar={profile.avatar}
            expression={pose.expression}
            motion={pose.motion}
            className="size-24 shrink-0"
            title={profile.name}
          />
          <div className="flex-1">
            <p className="text-lg font-black">{profile.name}</p>
            <p className="text-xs text-muted-foreground">
              일상 이야기부터 고민까지, 편하게 말 걸어 주세요.
              {source === "tilon" && " · 🟢 틸론 GPU"}
              {source === "llm" && " · 🟢 AI 연결됨"}
              {offline && " · ⚪ AI 미연결"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil /> 꾸미기
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {offline && (
          <p className="rounded-xl border border-dashed bg-secondary/60 p-4 text-sm">
            ⚪ 지금은 AI(LLM)가 연결되어 있지 않아 대화할 수 없어요. 정해진 답을 꾸며 보여 주지 않아요. 관리자가 <code>.env.local</code>에 LLM 정보를 넣으면 바로 대화할 수 있어요.
          </p>
        )}
        {messages.length === 0 && !offline && (
          <p className="py-6 text-center text-sm text-muted-foreground">{profile.name}에게 오늘 있었던 일이나 요즘 고민을 이야기해 보세요.</p>
        )}
        {messages.map((m, i) =>
          m.role === "tini" ? (
            <div key={i} className="flex items-end gap-2">
              <TiniCharacter avatar={profile.avatar} motion="none" className="size-10 shrink-0" />
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-card px-4 py-2 shadow-sm ring-1 ring-border">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">
                {m.content}
              </p>
            </div>
          )
        )}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {profile.name}이(가) 생각하는 중…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <Card className="sticky bottom-3">
        <CardContent className="flex items-end gap-2">
          <Textarea
            value={input}
            rows={2}
            maxLength={1000}
            placeholder="무엇이든 이야기해 보세요. (Enter 전송)"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading || offline}
          />
          <Button onClick={send} disabled={loading || offline || !input.trim()} aria-label="보내기">
            <Send />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
