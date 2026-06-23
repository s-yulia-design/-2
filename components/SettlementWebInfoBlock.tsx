"use client";



import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import type { SettlementWebInfo } from "@prisma/client";

import { SETTLEMENT_TYPES } from "@/lib/constants";

import {

  SOURCE_KIND_LABELS,

  sourcesFromJson,

  type DataSourceLink,

} from "@/lib/officialSources";



type Props = {

  settlementId: string;

  webInfo: SettlementWebInfo | null;

};



function webInfoToForm(webInfo: SettlementWebInfo | null) {

  return {

    population: webInfo?.population?.toString() ?? "",

    householdsCount: webInfo?.householdsCount?.toString() ?? "",

    coordinates: webInfo?.coordinates ?? "",

    socialObjects: webInfo?.socialObjects ?? "",

    businessObjects: webInfo?.businessObjects ?? "",

    buildingType: webInfo?.buildingType ?? "",

    sourceUrl: webInfo?.sourceUrl ?? "",

    comment: webInfo?.comment ?? "",

    dataStatus: webInfo?.dataStatus ?? "внесено_вручную",

    sources: sourcesFromJson(webInfo?.sourcesJson),

  };

}



export function SettlementWebInfoBlock({ settlementId, webInfo }: Props) {

  const router = useRouter();

  const [searchLoading, setSearchLoading] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);

  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [form, setForm] = useState(() => webInfoToForm(webInfo));



  useEffect(() => {

    setForm(webInfoToForm(webInfo));

  }, [webInfo]);



  async function searchWeb() {

    setSearchLoading(true);

    setMessage(null);

    try {

      const res = await fetch(`/api/settlements/${settlementId}/search-web`, {
        method: "POST",
      });

      let data: (SettlementWebInfo & { error?: string }) | null = null;
      try {
        data = (await res.json()) as SettlementWebInfo & { error?: string };
      } catch {
        setMessage({
          type: "error",
          text: "Сервер вернул некорректный ответ. Обновите страницу и попробуйте снова.",
        });
        return;
      }

      if (!res.ok || !data) {
        setMessage({
          type: "error",
          text: data?.error || `Ошибка сервера (${res.status})`,
        });
        return;
      }



      setForm(webInfoToForm(data));

      const found = [data.population, data.coordinates, data.sourceUrl].some(Boolean);

      setMessage({

        type: found ? "ok" : "error",

        text: found

          ? "Данные собраны из официальных реестров и справочников. Сверьте с Росстатом и подтвердите."

          : "Мало данных в открытых источниках. Используйте ссылки ниже или внесите вручную.",

      });

      router.refresh();

    } catch {

      setMessage({ type: "error", text: "Нет связи с сервером. Проверьте, что сайт запущен." });

    } finally {

      setSearchLoading(false);

    }

  }



  async function save(confirm = false) {

    setSaveLoading(true);

    setMessage(null);

    try {

      const res = await fetch(`/api/settlements/${settlementId}/web-info`, {

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

      if (!res.ok) {
        setMessage({ type: "error", text: "Не удалось сохранить" });
        return;
      }

      const saved = (await res.json()) as SettlementWebInfo;
      setForm(webInfoToForm(saved));
      setMessage({
        type: "ok",

        text: confirm ? "Данные подтверждены" : "Сохранено",

      });

      router.refresh();

    } catch {

      setMessage({ type: "error", text: "Ошибка сети при сохранении" });

    } finally {

      setSaveLoading(false);

    }

  }



  const statusClass =

    form.dataStatus === "подтверждено"

      ? "badge badge-green"

      : form.dataStatus === "найдено_автоматически"

        ? "badge badge-yellow"

        : form.dataStatus === "требует_проверки"

          ? "badge badge-yellow"

          : "badge badge-gray";

  return (

    <div className="space-y-4">

      <div className="flex flex-wrap items-center justify-between gap-2">

        <div>

          <h2 className="text-lg font-semibold">Справка о населённом пункте</h2>

          <p className="text-sm text-[var(--muted)]">

            «Найти в интернете» собирает данные из официальных источников (Росстат/ЕМИСС, ФИАС,

            открытые данные) и справочников. Сверьте цифры и нажмите «Подтвердить данные».

          </p>

        </div>

        <span className={statusClass}>{form.dataStatus.replaceAll("_", " ")}</span>

      </div>



      {message && (

        <div

          className={`rounded-lg border px-3 py-2 text-sm ${

            message.type === "ok"

              ? "border-green-200 bg-green-50 text-green-900"

              : "border-red-200 bg-red-50 text-red-900"

          }`}

        >

          {message.text}

        </div>

      )}



      {form.sources.length > 0 && (

        <SourcesPanel sources={form.sources} />

      )}



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

          <label className="label">Основная ссылка-источник</label>

          <input

            className="input"

            value={form.sourceUrl}

            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}

            placeholder="https://fedstat.ru/... или другой официальный источник"

          />

        </div>

        <div className="md:col-span-2">

          <label className="label">Комментарий / примечание к источникам</label>

          <textarea

            className="textarea"

            rows={2}

            value={form.comment}

            onChange={(e) => setForm({ ...form, comment: e.target.value })}

          />

        </div>

      </div>



      <div className="flex flex-wrap gap-2">

        <button

          type="button"

          className="btn btn-primary"

          onClick={searchWeb}

          disabled={searchLoading}

        >

          {searchLoading ? "Собираем из источников…" : "Найти в интернете"}

        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => save(false)}
          disabled={saveLoading}
        >
          {saveLoading ? "Сохранение…" : "Сохранить"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => save(true)}
          disabled={saveLoading}
        >
          {saveLoading ? "Сохранение…" : "Подтвердить данные"}
        </button>

      </div>

    </div>

  );

}



function SourcesPanel({ sources }: { sources: DataSourceLink[] }) {

  return (

    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">

      <h3 className="text-sm font-semibold text-blue-950">Источники данных</h3>

      <p className="mt-1 text-xs text-blue-900">

        Официальные — для проверки менеджером. Справочные — для ориентира.

      </p>

      <ul className="mt-3 space-y-2">

        {sources.map((source) => (

          <li key={source.url} className="text-sm">

            <div className="flex flex-wrap items-center gap-2">

              <span

                className={`badge ${

                  source.kind === "official"

                    ? "badge-green"

                    : source.kind === "open_data"

                      ? "badge-yellow"

                      : "badge-gray"

                }`}

              >

                {SOURCE_KIND_LABELS[source.kind]}

              </span>

              <a

                href={source.url}

                target="_blank"

                rel="noreferrer"

                className="font-medium text-[var(--primary)] hover:underline"

              >

                {source.title}

              </a>

            </div>

            {source.note && (

              <p className="mt-0.5 text-xs text-[var(--muted)]">{source.note}</p>

            )}

          </li>

        ))}

      </ul>

    </div>

  );

}


