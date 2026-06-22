"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Competitor } from "@prisma/client";
import { COMPETITOR_TECHNOLOGIES } from "@/lib/constants";

type Props = {
  settlementId: string;
  competitors: Competitor[];
};

export function CompetitorsBlock({ settlementId, competitors }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    technology: "неизвестно",
    tariff: "",
    speed: "",
    coverageNotes: "",
    weaknesses: "",
    sourceUrl: "",
    comment: "",
  });

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tariff: form.tariff ? Number(form.tariff) : null,
        }),
      });
      setForm({
        name: "",
        technology: "неизвестно",
        tariff: "",
        speed: "",
        coverageNotes: "",
        weaknesses: "",
        sourceUrl: "",
        comment: "",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function confirmCompetitor(competitorId: string) {
    await fetch(`/api/settlements/${settlementId}/competitors/${competitorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    router.refresh();
  }

  async function removeCompetitor(competitorId: string) {
    if (!confirm("Удалить конкурента?")) return;
    await fetch(`/api/settlements/${settlementId}/competitors/${competitorId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Конкуренты</h2>
        <p className="text-sm text-[var(--muted)]">
          Данные с сайтов провайдеров и открытых источников
        </p>
      </div>

      <form onSubmit={addCompetitor} className="card grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Название провайдера</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Технология</label>
          <select
            className="select"
            value={form.technology}
            onChange={(e) => setForm({ ...form, technology: e.target.value })}
          >
            {COMPETITOR_TECHNOLOGIES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Тариф, ₽</label>
          <input
            className="input"
            type="number"
            value={form.tariff}
            onChange={(e) => setForm({ ...form, tariff: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Скорость</label>
          <input
            className="input"
            placeholder="до 100 Мбит/с"
            value={form.speed}
            onChange={(e) => setForm({ ...form, speed: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Покрытие</label>
          <input
            className="input"
            value={form.coverageNotes}
            onChange={(e) => setForm({ ...form, coverageNotes: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Слабые места / жалобы</label>
          <input
            className="input"
            value={form.weaknesses}
            onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Ссылка-источник</label>
          <input
            className="input"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Добавить конкурента
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {competitors.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Конкуренты не добавлены</p>
        ) : (
          competitors.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {c.technology}
                    {c.tariff ? ` · ${c.tariff} ₽` : ""}
                    {c.speed ? ` · ${c.speed}` : ""}
                  </p>
                </div>
                <span
                  className={
                    c.dataStatus === "подтверждено"
                      ? "badge badge-green"
                      : "badge badge-yellow"
                  }
                >
                  {c.dataStatus.replaceAll("_", " ")}
                </span>
              </div>
              {c.weaknesses && (
                <p className="mt-2 text-sm">Слабые места: {c.weaknesses}</p>
              )}
              {c.sourceUrl && (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-[var(--primary)]"
                >
                  Источник
                </a>
              )}
              <div className="mt-3 flex gap-2">
                {c.dataStatus !== "подтверждено" && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => confirmCompetitor(c.id)}
                  >
                    Подтвердить
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => removeCompetitor(c.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
