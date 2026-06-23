export function HomeGuide() {
  return (
    <div className="help-box space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Как пользоваться</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Главная таблица — только сводка. Все действия — внутри карточки населённого пункта.
        </p>
      </div>
      <ol className="grid gap-3 text-sm md:grid-cols-3">
        <li className="help-step">
          <span className="help-step-num">1</span>
          <div>
            <strong>Откройте НП</strong>
            <p className="text-[var(--muted)]">
              Нажмите синее название или кнопку «Открыть» в строке таблицы
            </p>
          </div>
        </li>
        <li className="help-step">
          <span className="help-step-num">2</span>
          <div>
            <strong>Справка → «Найти в интернете»</strong>
            <p className="text-[var(--muted)]">
              Росстат, ФИАС, открытые данные и справочники — сверить и подтвердить
            </p>
          </div>
        </li>
        <li className="help-step">
          <span className="help-step-num">3</span>
          <div>
            <strong>Заявки и Конкуренты</strong>
            <p className="text-[var(--muted)]">
              Вносите вручную или импортируйте CSV. Итог — на вкладке «Итог»
            </p>
          </div>
        </li>
      </ol>
      <p className="text-sm text-[var(--muted)]">
        В таблице — населённые пункты Волгоградской области для анализа. Откройте любой НП,
        чтобы подтянуть справку из интернета и внести заявки.
      </p>
    </div>
  );
}
