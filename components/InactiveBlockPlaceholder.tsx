export function InactiveBlockPlaceholder({ title }: { title: string }) {
  return (
    <div className="inactive-block card border-dashed bg-slate-50">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Раздел заполняется техническим специалистом. В пробной версии для
            менеджера недоступен.
          </p>
          <p className="mt-2 text-sm">
            После техобследования здесь появятся: расстояние до сети, смета,
            окупаемость и сценарный расчёт.
          </p>
        </div>
      </div>
    </div>
  );
}
