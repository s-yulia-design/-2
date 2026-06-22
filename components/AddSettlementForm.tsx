"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VOLGOGRAD_DISTRICTS } from "@/lib/constants";

export function AddSettlementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<string>(VOLGOGRAD_DISTRICTS[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), district }),
      });
      if (!res.ok) throw new Error("Ошибка создания");
      const data = (await res.json()) as { id: string };
      router.push(`/settlements/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Добавить населённый пункт
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex min-w-[280px] flex-col gap-3">
      <h3 className="font-semibold">Новый населённый пункт</h3>
      <div>
        <label className="label">Название</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Городище"
          required
        />
      </div>
      <div>
        <label className="label">Район</label>
        <select
          className="select"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          {VOLGOGRAD_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Сохранение..." : "Создать"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Отмена
        </button>
      </div>
    </form>
  );
}
