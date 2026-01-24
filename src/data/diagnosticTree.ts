export type DiagnosticOption = {
  label: string
  next: string
}

export type DiagnosticQuestion = {
  type: 'question'
  text: string
  helper?: string
  options: DiagnosticOption[]
}

export type DiagnosticResult = {
  type: 'result'
  title: string
  diagnosis: string
  recommendations: string[]
  premium?: boolean
  premiumTeaser?: string
}

export type DiagnosticNode = DiagnosticQuestion | DiagnosticResult

export type DiagnosticTree = {
  id: string
  title: string
  start: string
  nodes: Record<string, DiagnosticNode>
}

export const diagnosticTree: DiagnosticTree = {
  id: 'loss-analyzer-v1',
  title: 'Диагностика поражения',
  start: 'q1',
  nodes: {
    q1: {
      type: 'question',
      text: 'Что делает соперник в начале схватки?',
      helper: 'Выбери наиболее похожий вариант.',
      options: [
        { label: 'Захватывает высоко и тянет', next: 'q2' },
        { label: 'Уходит в глубокий крюк', next: 'q3' },
        { label: 'Пытается продавить вниз', next: 'q4' },
        { label: 'Не уверен', next: 'q5' },
      ],
    },
    q2: {
      type: 'question',
      text: 'В какой момент ты начал терять контроль?',
      options: [
        { label: 'Сразу на старте', next: 'q6' },
        { label: 'Через 2–3 секунды', next: 'q7' },
        { label: 'Под самый финиш', next: 'q8' },
      ],
    },
    q3: {
      type: 'question',
      text: 'Что отказало первым в крюке?',
      options: [
        { label: 'Кисть свернулась внутрь', next: 'r1' },
        { label: 'Рука разогнулась', next: 'r2' },
        { label: 'Бок развалился', next: 'r3' },
      ],
    },
    q4: {
      type: 'question',
      text: 'Когда началось давление вниз?',
      options: [
        { label: 'На старте', next: 'r4' },
        { label: 'После захвата позиции', next: 'r5' },
        { label: 'В затяжной борьбе', next: 'r6' },
      ],
    },
    q5: {
      type: 'question',
      text: 'Опиши положение кисти перед проигрышем.',
      options: [
        { label: 'Кисть раскрылась назад', next: 'r7' },
        { label: 'Кисть согнута, но рука ушла в сторону', next: 'r8' },
        { label: 'Рука прямая и слабая', next: 'r9' },
      ],
    },
    q6: {
      type: 'question',
      text: 'Что ты почувствовал в кисти?',
      options: [
        { label: 'Потеря пронации', next: 'r10' },
        { label: 'Пальцы не удержали захват', next: 'r11' },
        { label: 'Локоть стал тяжелым', next: 'r12' },
      ],
    },
    q7: {
      type: 'question',
      text: 'Что делал соперник в середине?',
      options: [
        { label: 'Поднимал мою кисть', next: 'r13' },
        { label: 'Забирал мою ладонь', next: 'r14' },
        { label: 'Давил в бок', next: 'r15' },
      ],
    },
    q8: {
      type: 'question',
      text: 'Почему не смог удержать финиш?',
      options: [
        { label: 'Не хватило запястья', next: 'r16' },
        { label: 'Не хватило спины', next: 'r17' },
        { label: 'Соперник перекрыл плечо', next: 'r18' },
      ],
    },
    r1: {
      type: 'result',
      title: 'Крюк без жесткой кисти',
      diagnosis: 'Ты вошел в крюк, но кисть не удержала супинацию и согнулась внутрь.',
      recommendations: ['Статика на cup с ремнем', 'Изоляция сгибателей кисти'],
    },
    r2: {
      type: 'result',
      title: 'Слабая связка бицепса',
      diagnosis: 'Рука разогнулась в крюке — нет устойчивого контроля локтя и тяги в себя.',
      recommendations: ['Изометрия на бицепс', 'Работа с ремнем на удержание'],
    },
    r3: {
      type: 'result',
      title: 'Недостаток бокового давления',
      diagnosis: 'Ты проиграл бок, потому что не удержал плечевую линию.',
      recommendations: ['Статика бокового давления', 'Стабилизация плеча'],
    },
    r4: {
      type: 'result',
      title: 'Ранний пресс соперника',
      diagnosis: 'Соперник сразу сел в пресс и продавил линию локтя.',
      recommendations: ['Высокий захват', 'Увод локтя в сторону'],
    },
    r5: {
      type: 'result',
      title: 'Промедление в центре',
      diagnosis: 'Ты дал сопернику занять позицию, и пресс стал безопасным для него.',
      recommendations: ['Жесткий старт', 'Контроль высоты и запястья'],
      premium: true,
      premiumTeaser: 'Разбор контр-атаки против пресса.',
    },
    r6: {
      type: 'result',
      title: 'Слабое удержание центра',
      diagnosis: 'В затяжной борьбе давление вниз прошло, потому что не хватило стабильности плеча.',
      recommendations: ['Долгая изометрия на удержание', 'Контроль корпуса'],
    },
    r7: {
      type: 'result',
      title: 'Потеря пронации',
      diagnosis: 'Соперник атаковал кисть и выбил пронацию.',
      recommendations: ['Пронация в ремне', 'Контроль высоты захвата'],
    },
    r8: {
      type: 'result',
      title: 'Провал в боке',
      diagnosis: 'Кисть осталась, но рука ушла в сторону — слабая боковая база.',
      recommendations: ['Боковая статика', 'Укрепление плечелучевой'],
    },
    r9: {
      type: 'result',
      title: 'Недостаток стартовой фиксации',
      diagnosis: 'Рука прямой линией проиграла рычаг, не было фиксации локтя.',
      recommendations: ['Стартовые удержания', 'Стабилизация локтя'],
    },
    r10: {
      type: 'result',
      title: 'Провал пронации на старте',
      diagnosis: 'Соперник забрал высоту, ты потерял пронацию и рычаг.',
      recommendations: ['Пронация через ремень', 'Жесткий захват сверху'],
    },
    r11: {
      type: 'result',
      title: 'Слабые пальцы',
      diagnosis: 'Пальцы раскрылись и захват исчез.',
      recommendations: ['Сгибание пальцев', 'Ролик на пальцы'],
    },
    r12: {
      type: 'result',
      title: 'Просел локоть',
      diagnosis: 'Локоть провалился из-за слабой линии корпуса.',
      recommendations: ['Статика на удержание центра', 'Корпус и спина'],
    },
    r13: {
      type: 'result',
      title: 'Потеря высоты',
      diagnosis: 'Соперник поднял кисть и лишил тебя высоты.',
      recommendations: ['Удержание riser', 'Высокий старт'],
      premium: true,
      premiumTeaser: 'Расширенный протокол против поднятия кисти.',
    },
    r14: {
      type: 'result',
      title: 'Потеря ладони',
      diagnosis: 'Соперник забрал ладонь, из-за чего ты лишился рычага.',
      recommendations: ['Переход в ремень', 'Усиление захвата'],
    },
    r15: {
      type: 'result',
      title: 'Слабый бок',
      diagnosis: 'Боковое давление соперника перевесило твой упор.',
      recommendations: ['Боковая статика', 'Контроль плеча'],
    },
    r16: {
      type: 'result',
      title: 'Недостаток запястья',
      diagnosis: 'На финише кисть не выдержала нагрузку.',
      recommendations: ['Финишные удержания', 'Раздельная работа кисти'],
    },
    r17: {
      type: 'result',
      title: 'Недостаток спины',
      diagnosis: 'Тяга спины не выдержала, линия ослабла.',
      recommendations: ['Тяга в столе', 'Изометрия спины'],
    },
    r18: {
      type: 'result',
      title: 'Плечо перекрыто',
      diagnosis: 'Соперник закрывал плечо и выключал линию.',
      recommendations: ['Контроль плеча', 'Позиция корпуса'],
      premium: true,
      premiumTeaser: 'Тактика выхода из перекрытого плеча.',
    },
  },
}
