"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DemandRequest } from "@prisma/client";
import { REQUEST_SOURCES, REQUEST_STATUSES } from "@/lib/constants";

type Props = {
  settlementId: string;
  requests: DemandRequest[];
};

export function DemandBlock({ settlementId, requests }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    street: "",
    house: "",
    source: "ручной ввод",
    status: "оставил заявку",
    isConfirmed: false,
    readyToPayConnection: false,
    readyToSignContract: false,
    isInitiativeGroup: false,
    comment: "",
  });

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/settlements/${settlementId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        street: "",
        house: "",
        source: "ручной ввод",
        status: "оставил заявку",
        isConfirmed: false,
        readyToPayConnection: false,
        readyToSignContract: false,
        isInitiativeGroup: false,
        comment: "",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeRequest(requestId: string) {
    if (!confirm("Удалить заявку?")) return;
    await fetch(`/api/settlements/${settlementId}/requests/${requestId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  async function importCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(`/api/settlements/${settlementId}/import-requests`, {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (!res.ok) alert(data.error || "Ошибка импорта");
      else alert(`Импортировано заявок: ${data.imported ?? 0}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Заявки и спрос</h2>
        <p className="text-sm text-[var(--muted)]">Ручной ввод — основной источник данных</p>
      </div>

      <form onSubmit={addRequest} className="card grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Улица</label>
          <input
            className="input"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Дом</label>
          <input
            className="input"
            value={form.house}
            onChange={(e) => setForm({ ...form, house: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Статус</label>
          <select
            className="select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Источник</label>
          <select
            className="select"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {REQUEST_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isConfirmed}
              onChange={(e) => setForm({ ...form, isConfirmed: e.target.checked })}
            />
            Подтверждена
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.readyToPayConnection}
              onChange={(e) => setForm({ ...form, readyToPayConnection: e.target.checked })}
            />
            Готов оплатить
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.readyToSignContract}
              onChange={(e) => setForm({ ...form, readyToSignContract: e.target.checked })}
            />
            Готов подписать договор
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isInitiativeGroup}
              onChange={(e) => setForm({ ...form, isInitiativeGroup: e.target.checked })}
            />
            Инициативная группа
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="label">Комментарий</label>
          <input
            className="input"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Добавить заявку
          </button>
          <label className="btn btn-secondary cursor-pointer">
            Импорт CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
          </label>
          <a
            href="/templates/requests.csv"
            download
            className="btn btn-secondary"
          >
            Скачать шаблон
          </a>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Адрес</th>
              <th>Статус</th>
              <th>Источник</th>
              <th>Подтв.</th>
              <th>Оплата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-[var(--muted)]">
                  Заявок пока нет
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.street}, {r.house}
                  </td>
                  <td>{r.status}</td>
                  <td>{r.source}</td>
                  <td>{r.isConfirmed ? "да" : "нет"}</td>
                  <td>{r.readyToPayConnection ? "да" : "нет"}</td>
                  <td>
                    <button
                      className="text-sm text-[var(--danger)]"
                      onClick={() => removeRequest(r.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
