"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SettlementWebInfo } from "@prisma/client";
import { SETTLEMENT_TYPES } from "@/lib/constants";

type Props = {
  settlementId: string;
  webInfo: SettlementWebInfo | null;
};

export function SettlementWebInfoBlock({ settlementId, webInfo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    population: webInfo?.population?.toString() ?? "",
    householdsCount: webInfo?.householdsCount?.toString() ?? "",
    coordinates: webInfo?.coordinates ?? "",
    socialObjects: webInfo?.socialObjects ?? "",
    businessObjects: webInfo?.businessObjects ?? "",
    buildingType: webInfo?.buildingType ?? "",
    sourceUrl: webInfo?.sourceUrl ?? "",
    comment: webInfo?.comment ?? "",
    dataStatus: webInfo?.dataStatus ?? "внесено_вручную",
  });

  async function searchWeb() {
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/search-web`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function save(confirm = false) {
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/web-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          population: form.population ? Number(form.population) : null,
          householdsCount: form.householdsCount ? Number(form.householdsCount) : null,
          coordinates: form.coordinates,
          socialObjects: form.socialObjects,
          businessObjects: form.businessObjects,
          buildingType: form.buildingType,
          sourceUrl: form.sourceUrl,
          comment: form.comment,
          confirm,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const statusClass =
    form.dataStatus === "подтверждено"
      ? "badge badge-green"
      : form.dataStatus === "найдено_автоматически"
        ? "badge badge-yellow"
        : "badge badge-gray";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Справка о населённом пункте</h2>
          <p className="text-sm text-[var(--muted)]">Данные из интернета с подтверждением</p>
        </div>
        <span className={statusClass}>{form.dataStatus.replaceAll("_", " ")}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Население</label>
          <input
            className="input"
            value={form.population}
            onChange={(e) => setForm({ ...form, population: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Количество домов</label>
          <input
            className="input"
            value={form.householdsCount}
            onChange={(e) => setForm({ ...form, householdsCount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Координаты</label>
          <input
            className="input"
            value={form.coordinates}
            onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Тип застройки</label>
          <select
            className="select"
            value={form.buildingType}
            onChange={(e) => setForm({ ...form, buildingType: e.target.value })}
          >
            <option value="">—</option>
            {SETTLEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Социальные объекты</label>
          <input
            className="input"
            placeholder="школа, ФАП, администрация"
            value={form.socialObjects}
            onChange={(e) => setForm({ ...form, socialObjects: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Бизнес-объекты</label>
          <input
            className="input"
            value={form.businessObjects}
            onChange={(e) => setForm({ ...form, businessObjects: e.target.value })}
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
          <label className="label">Комментарий</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary" onClick={searchWeb} disabled={loading}>
          Найти в интернете
        </button>
        <button className="btn btn-primary" onClick={() => save(false)} disabled={loading}>
          Сохранить
        </button>
        <button className="btn btn-primary" onClick={() => save(true)} disabled={loading}>
          Подтвердить данные
        </button>
      </div>
    </div>
  );
}
