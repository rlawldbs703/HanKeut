"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Capsule, loadCapsules, saveCapsule } from "@/lib/storage";

const PRESETS = [
  { years: 1, label: "1년 뒤의 나" },
  { years: 3, label: "3년 뒤의 나" },
  { years: 5, label: "5년 뒤의 나" },
];
const PROMPTS = ["그때의 나는 무엇을 하고 있을까?", "지금의 꿈을 이루었을까?", "지금 걱정하는 일은 어떻게 되었을까?", "미래의 나에게 꼭 해주고 싶은 말은?"];

/** 한국 시간 기준 YYYY-MM-DD (toISOString은 UTC라 하루가 밀릴 수 있어요) */
export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addYears = (y: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + y);
  return localDate(d);
};
export const isOpenable = (c: Capsule, today = localDate(new Date())) => c.openAt <= today;

/** 미래의 나에게 보내는 타임캡슐 작성 */
export function TimeCapsule({ letterExcerpt, onSaved }: { letterExcerpt?: string; onSaved?: () => void }) {
  const [openAt, setOpenAt] = useState(addYears(1));
  const [custom, setCustom] = useState(false);
  const [answers, setAnswers] = useState<string[]>(PROMPTS.map(() => ""));
  const [saved, setSaved] = useState(false);
  const [tomorrow] = useState(() => localDate(new Date(Date.now() + 86400000)));

  function save() {
    if (answers.every((a) => !a.trim())) {
      toast.info("한 줄이라도 남겨 줘.");
      return;
    }
    if (openAt < tomorrow) {
      toast.info("내일 이후의 날짜를 골라 줘.");
      return;
    }
    saveCapsule({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      openAt,
      entries: PROMPTS.map((q, i) => ({ q, a: answers[i].trim() })).filter((e) => e.a),
      letterExcerpt,
    });
    setSaved(true);
    onSaved?.();
  }

  if (saved)
    return (
      <div className="space-y-2 text-center">
        <p className="text-3xl">⏳</p>
        <p className="font-bold">타임캡슐을 묻었어요</p>
        <p className="text-sm text-muted-foreground">
          {openAt}부터 이 브라우저의 &lsquo;별의 끝에서&rsquo; 화면 아래 목록에서 열어 볼 수 있어요. (알림은 보내지 않아요)
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-black">미래의 나에게 남기는 타임캡슐</p>
        <p className="text-sm text-muted-foreground">언제의 나에게 보낼까?</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.years} size="sm" variant={!custom && openAt === addYears(p.years) ? "default" : "outline"} onClick={() => { setCustom(false); setOpenAt(addYears(p.years)); }}>
            {p.label}
          </Button>
        ))}
        <Button size="sm" variant={custom ? "default" : "outline"} onClick={() => setCustom(true)}>직접 날짜 지정</Button>
      </div>
      {custom && (
        <div className="space-y-1">
          <Label htmlFor="capsule-date">열어 볼 날짜</Label>
          <Input id="capsule-date" type="date" min={tomorrow} value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
        </div>
      )}
      {PROMPTS.map((q, i) => (
        <div key={q} className="space-y-1">
          <Label htmlFor={`cap-${i}`}>{q}</Label>
          <Textarea id={`cap-${i}`} rows={2} maxLength={600} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((v, k) => (k === i ? e.target.value : v)))} />
        </div>
      ))}
      <Button className="w-full" onClick={save}>{openAt}에 열리는 타임캡슐 묻기</Button>
    </div>
  );
}

/** 저장된 타임캡슐 목록: 날짜가 되기 전에는 잠겨 있어요 */
export function CapsuleList() {
  const [capsules] = useState(() => loadCapsules());
  const [opened, setOpened] = useState<string | null>(null);
  if (capsules.length === 0) return null;
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <p className="font-bold">⏳ 나의 타임캡슐</p>
      {capsules.map((c) => {
        const can = isOpenable(c);
        return (
          <div key={c.id} className="rounded-xl border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>{localDate(new Date(c.createdAt))}에 묻음 · {c.openAt} 개봉</span>
              {can ? (
                <Button size="sm" variant="outline" onClick={() => setOpened(opened === c.id ? null : c.id)}>{opened === c.id ? "닫기" : "열어 보기"}</Button>
              ) : (
                <span className="text-muted-foreground">🔒 {c.openAt}에 열 수 있어요</span>
              )}
            </div>
            {can && opened === c.id && (
              <div className="mt-2 space-y-2">
                {c.entries.map((e) => (
                  <p key={e.q}><b>{e.q}</b><br />{e.a}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">이 브라우저에만 저장돼요. 알림은 보내지 않으니, 그날 직접 열어 봐 주세요.</p>
    </div>
  );
}
