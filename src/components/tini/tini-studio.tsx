"use client";

import { Loader2, Pencil, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHydrated } from "@/hooks/use-hydrated";
import { loadTiniChat, loadTiniProfile, saveTiniChat, saveTiniProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AiSource, TiniMessage, TiniProfile } from "@/types";

const EMOJIS = ["🐣", "🐰", "🐻", "🦊", "🐱", "🐶", "🐼", "🦄"];
const COLORS = ["#fbcfe8", "#bfdbfe", "#bbf7d0", "#fde68a", "#ddd6fe", "#fed7aa"];
const PERSONALITIES: { value: TiniProfile["personality"]; label: string }[] = [
  { value: "warm", label: "🤗 다정한" },
  { value: "realistic", label: "🧭 현실적인" },
  { value: "cheerful", label: "🎉 유쾌한" },
];
const STYLES: { value: TiniProfile["speechStyle"]; label: string }[] = [
  { value: "casual", label: "반말" },
  { value: "polite", label: "존댓말" },
];

const DEFAULT_PROFILE: TiniProfile = {
  name: "티니",
  emoji: "🐣",
  color: COLORS[0],
  personality: "warm",
  speechStyle: "casual",
};

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
        }}
      />
    );
  }
  return <TiniChat profile={profile} onEdit={() => setEditing(true)} />;
}

function TiniAvatar({ profile, size = "md" }: { profile: TiniProfile; size?: "md" | "lg" }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full ring-2 ring-background",
        size === "lg" ? "size-20 text-5xl" : "size-9 text-xl"
      )}
      style={{ backgroundColor: profile.color }}
    >
      {profile.emoji}
    </div>
  );
}

function OptionButtons<T extends string>({
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
          variant={value === o.value ? "default" : "outline"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

function TiniEditor({ initial, onSave }: { initial: TiniProfile; onSave: (p: TiniProfile) => void }) {
  const [p, setP] = useState(initial);
  const set = <K extends keyof TiniProfile>(k: K, v: TiniProfile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>나만의 MINI-TTINI 꾸미기</CardTitle>
        <CardDescription>고민을 들어 줄 AI 친구를 직접 만들어요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-center">
          <TiniAvatar profile={p} size="lg" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tini-name">이름</Label>
          <Input
            id="tini-name"
            value={p.name}
            maxLength={20}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>캐릭터</Label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`캐릭터 ${e}`}
                onClick={() => set("emoji", e)}
                className={cn(
                  "size-10 rounded-full text-2xl ring-1 ring-border",
                  p.emoji === e && "ring-2 ring-primary"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>색깔</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`색 ${c}`}
                onClick={() => set("color", c)}
                className={cn("size-8 rounded-full ring-1 ring-border", p.color === c && "ring-2 ring-primary")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>성격</Label>
          <OptionButtons options={PERSONALITIES} value={p.personality} onChange={(v) => set("personality", v)} />
        </div>
        <div className="space-y-2">
          <Label>말투</Label>
          <OptionButtons options={STYLES} value={p.speechStyle} onChange={(v) => set("speechStyle", v)} />
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            if (!p.name.trim()) return toast.warning("이름을 지어 주세요.");
            onSave({ ...p, name: p.name.trim() });
          }}
        >
          저장하고 대화하기
        </Button>
      </CardContent>
    </Card>
  );
}

function TiniChat({ profile, onEdit }: { profile: TiniProfile; onEdit: () => void }) {
  const [messages, setMessages] = useState<TiniMessage[]>(() => loadTiniChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<AiSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

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
        body: JSON.stringify({ profile, messages: next.slice(-20) }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { reply: string; source: AiSource };
      const withReply: TiniMessage[] = [...next, { role: "tini", content: data.reply }];
      setMessages(withReply);
      setSource(data.source);
      saveTiniChat(withReply);
    } catch {
      toast.error(`${profile.name}의 답을 받지 못했어요.`);
      setMessages(messages);
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center gap-3">
          <TiniAvatar profile={profile} />
          <div className="flex-1">
            <p className="font-bold">{profile.name}</p>
            <p className="text-xs text-muted-foreground">
              답을 대신 써 주지 않아요. 내 생각을 정리하도록 도와줘요.
              {source && (source === "tilon" ? " · 🟢 틸론 GPU" : " · 🟡 데모")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil /> 꾸미기
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {profile.name}에게 요즘 고민을 털어놓아 보세요.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "tini" ? (
            <div key={i} className="flex items-end gap-2">
              <TiniAvatar profile={profile} />
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-background px-4 py-2 shadow-sm ring-1 ring-border">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TiniAvatar profile={profile} />
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Card className="sticky bottom-3">
        <CardContent className="flex items-end gap-2">
          <Textarea
            value={input}
            rows={2}
            maxLength={1000}
            placeholder="고민을 적어 보세요. (Enter 전송)"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()} aria-label="보내기">
            <Send />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
