// Ready-made scenes: cloud variety + time of day + Sun/Moon + tone.
// The first nine were tuned against reference sky photographs.
// sunAz / moonAz are offsets (radians) from the current camera yaw.

export const READY_THEMES = [
  {
    id: 'photo_1_floccus',
    title: { ru: '📸 Пышные хлопья Altocumulus floccus', en: '📸 Puffy Altocumulus floccus' },
    tag: { ru: 'Фото-референс 1 • День', en: 'Photo reference 1 • Day' },
    desc: {
      ru: 'Густые белоснежные ватные хлопья, переходящие от отдельных комочков к плотному солнечному покрову на синем небе.',
      en: 'Dense snow-white cotton tufts that grade from separate cloudlets into a sunlit continuous layer against a blue sky.'
    },
    species: 'altocumulus_floccus', customModeId: 6.0, sunEl: 42, sunAz: 0.35, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.64, tone: 'light', dark: 0.16
  },
  {
    id: 'photo_2_undulatus',
    title: { ru: '📸 Высотная сотовая рябь «барашки»', en: '📸 High cellular cirrocumulus ripples' },
    tag: { ru: 'Фото-референс 2 • День', en: 'Photo reference 2 • Day' },
    desc: {
      ru: 'Тысячи чётких мелких белых комочков Cirrocumulus undulatus, выстроенных диагональными волнами по всему небу.',
      en: 'Thousands of crisp small white Cirrocumulus undulatus tufts lined up in diagonal waves across the sky.'
    },
    species: 'cirrocumulus_fine', customModeId: 5.0, sunEl: 44, sunAz: -0.35, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.64, tone: 'light', dark: 0.12
  },
  {
    id: 'castellanus_veil',
    title: { ru: '📸 Башенки Castellanus + ледяная вуаль', en: '📸 Castellanus turrets + ice veil' },
    tag: { ru: 'Фото-референс 3 • День', en: 'Photo reference 3 • Day' },
    desc: {
      ru: 'Кипящие кучевые башенки Altocumulus castellanus по центру и гладкая полупрозрачная ледяная пелена справа вверху.',
      en: 'Boiling Altocumulus castellanus turrets in the centre and a smooth translucent ice veil in the upper right.'
    },
    species: 'cloud_in_veil', customModeId: 12.0, sunEl: 36, sunAz: 0.40, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.58, tone: 'light', dark: 0.18
  },
  {
    id: 'photo_4_vertebratus',
    title: { ru: '📸 Струйные полосы и «хребты» Cirrus', en: '📸 Jet-stream bands and cirrus spines' },
    tag: { ru: 'Фото-референс 4 • День', en: 'Photo reference 4 • Day' },
    desc: {
      ru: 'Мощные диагональные полосы перистых облаков Cirrus vertebratus / intortus с поперечными рёбрами и ледяной дымкой.',
      en: 'Powerful diagonal bands of Cirrus vertebratus / intortus with transverse ribs and icy haze.'
    },
    species: 'cirrus_vertebratus', customModeId: 2.0, sunEl: 28, sunAz: -0.30, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.58, tone: 'light', dark: 0.14
  },
  {
    id: 'photo_5_fibratus',
    title: { ru: '📸 Шелковистые нити Cirrus fibratus', en: '📸 Silky Cirrus fibratus threads' },
    tag: { ru: 'Фото-референс 5 • День', en: 'Photo reference 5 • Day' },
    desc: {
      ru: 'Длинные изящные диагональные ледяные волокна и нити в чистом голубом небе.',
      en: 'Long graceful diagonal ice fibres and threads in a clear blue sky.'
    },
    species: 'cirrus_classic', customModeId: 0.0, sunEl: 30, sunAz: -0.38, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.54, tone: 'light', dark: 0.10
  },
  {
    id: 'frontal_boundary',
    title: { ru: '📸 Стык фронта (перистые + барашки)', en: '📸 Frontal boundary (cirrus + altocumulus)' },
    tag: { ru: 'Фото-референс 6 • Контраст масс', en: 'Photo reference 6 • Air-mass contrast' },
    desc: {
      ru: 'Наглядная граница двух воздушных масс: слева длинные полосы Cirrus, справа густое подсвеченное поле Altocumulus.',
      en: 'A clear boundary between two air masses: long Cirrus bands on the left, a dense sunlit field of Altocumulus on the right.'
    },
    species: 'altocumulus_floccus', customModeId: 13.0, sunEl: 38, sunAz: 0.28, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.62, tone: 'mixed', dark: 0.42
  },
  {
    id: 'sun_chain_cu',
    title: { ru: '📸 Сияющее Солнце и гряда кучевых хлопьев', en: '📸 Blazing Sun and a chain of cumulus' },
    tag: { ru: 'Фото-референс 7 • Корона Ми', en: 'Photo reference 7 • Mie corona' },
    desc: {
      ru: 'Яркое непрозрачное Солнце с лучистой короной и горизонтальная цепочка кучевых хлопьев с серебристой каймой.',
      en: 'A bright opaque Sun with a radiant corona and a horizontal chain of cumulus tufts with silver linings.'
    },
    species: 'cumulus_summer', customModeId: 14.0, sunEl: 32, sunAz: 0.16, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.54, tone: 'mixed', dark: 0.38
  },
  {
    id: 'photo_8_lacunosus',
    title: { ru: '📸 Ажурные «лакунозус» с окнами распада', en: '📸 Lacy lacunosus with decay holes' },
    tag: { ru: 'Фото-референс 8 • Lacunosus', en: 'Photo reference 8 • Lacunosus' },
    desc: {
      ru: 'Ажурное поле перисто-кучевых хлопьев с круглыми голубыми «проталинами» нисходящих термиков и волокнистыми краями.',
      en: 'A lacy field of cirrocumulus tufts with round blue holes from downdrafts and fibrous edges.'
    },
    species: 'altocumulus_lacunosus', customModeId: 11.0, sunEl: 38, sunAz: -0.25, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.50, lunarEc: 0.0, showPlane: false, cov: 0.60, tone: 'light', dark: 0.15
  },
  {
    id: 'night_moon_mackerel',
    title: { ru: '📸 Ночные «барашки» с золотистым просветом Луны', en: '📸 Night altocumulus with a golden moon window' },
    tag: { ru: 'Фото-референс 9 • Ночной венец', en: 'Photo reference 9 • Lunar corona' },
    desc: {
      ru: 'Тёмные ночные облака-хлопья Altocumulus perlucidus, сквозь окно в которых светит Луна и подсвечивает края туч тёплым венцом.',
      en: 'Dark night Altocumulus perlucidus tufts with the Moon shining through a gap and lighting the cloud edges with a warm corona.'
    },
    species: 'altocumulus_floccus', customModeId: 15.0, sunEl: -18, sunAz: -0.50, showMoon: true, moonEl: 0.36, moonAz: 0.0, moonPhase: 0.98, lunarEc: 0.0, showPlane: false, cov: 0.68, tone: 'mixed', dark: 0.64
  },
  {
    id: 'theme_classic_cirrus',
    title: { ru: '⭐ Ясный день с перистыми и лайнерами', en: '⭐ Clear day with cirrus and airliners' },
    tag: { ru: 'Cirrus + авиация', en: 'Cirrus + aviation' },
    desc: {
      ru: 'Глубокий синий зенит, длинные диагональные нити Cirrus и летящие самолёты с расширяющимся следом.',
      en: 'Deep blue zenith, long diagonal Cirrus threads and passing airliners with spreading contrails.'
    },
    species: 'cirrus_classic', sunEl: 36, sunAz: -0.32, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 1.00, lunarEc: 0.0, showPlane: true, cov: 0.52, tone: 'mixed', dark: 0.45
  },
  {
    id: 'theme_uncinus_day',
    title: { ru: '🪶 Перистые «конские хвосты» днём', en: "🪶 Daytime mare's tails" },
    tag: { ru: 'Cirrus uncinus • День', en: 'Cirrus uncinus • Day' },
    desc: {
      ru: 'Изящные загнутые перья и когти перистых облаков, парящие в чистом лазурном небе.',
      en: 'Graceful curled cirrus plumes and hooks floating in a clear azure sky.'
    },
    species: 'cirrus_uncinus', sunEl: 40, sunAz: -0.25, showMoon: false, moonEl: 0.44, moonAz: 0.50, moonPhase: 0.50, lunarEc: 0.0, showPlane: true, cov: 0.48, tone: 'light', dark: 0.15
  },
  {
    id: 'theme_vertebratus_day',
    title: { ru: '🦴 Перистые «рыбьи хребты» у Солнца', en: '🦴 Fish-bone cirrus near the Sun' },
    tag: { ru: 'Cirrus vertebratus • День', en: 'Cirrus vertebratus • Day' },
    desc: {
      ru: 'Ребристые перистые перья с плотным стержнем, подсвеченные ярким дневным Солнцем.',
      en: 'Ribbed cirrus plumes with a dense spine, lit by the bright daytime Sun.'
    },
    species: 'cirrus_vertebratus', sunEl: 30, sunAz: -0.10, showMoon: false, moonEl: 0.40, moonAz: 0.55, moonPhase: 0.45, lunarEc: 0.0, showPlane: true, cov: 0.54, tone: 'mixed', dark: 0.48
  },
  {
    id: 'theme_summer_cumulus',
    title: { ru: '☁️ Летний полдень: смешанные кучевые', en: '☁️ Summer noon: mixed cumulus' },
    tag: { ru: 'Cumulus humilis • Светлые + плотные', en: 'Cumulus humilis • Light + dense' },
    desc: {
      ru: 'Сочетание воздушных белоснежных облаков и объёмных кучевых туч с глубоким тёмным основанием.',
      en: 'A mix of airy white clouds and volumetric cumulus with deep dark bases.'
    },
    species: 'cumulus_summer', sunEl: 42, sunAz: -0.30, showMoon: false, moonEl: 0.45, moonAz: 0.42, moonPhase: 1.00, lunarEc: 0.0, showPlane: true, cov: 0.52, tone: 'mixed', dark: 0.56
  },
  {
    id: 'theme_cloud_in_veil',
    title: { ru: '🌤️ Пушистое облачко в перистой дымке', en: '🌤️ Puffy cloud in a cirrus haze' },
    tag: { ru: 'Двухслойное небо • Cumulus + Cirrus', en: 'Two-layer sky • Cumulus + Cirrus' },
    desc: {
      ru: 'Воздушные кучевые клочки на фоне диагональной шелковистой перистой вуали.',
      en: 'Airy cumulus fragments against a diagonal silky cirrus veil.'
    },
    species: 'cloud_in_veil', sunEl: 35, sunAz: -0.22, showMoon: false, moonEl: 0.44, moonAz: 0.38, moonPhase: 0.50, lunarEc: 0.0, showPlane: true, cov: 0.52, tone: 'mixed', dark: 0.50
  },
  {
    id: 'theme_white_mackerel',
    title: { ru: '🐑 «Барашки»: светлые и плотные', en: '🐑 Cirrocumulus: light and dense' },
    tag: { ru: 'Cirrocumulus • Смешанный тон', en: 'Cirrocumulus • Mixed tone' },
    desc: {
      ru: 'Высотная рябь по всему небу, где белоснежные хлопья переходят в более плотные теневые гряды.',
      en: 'High-altitude ripples across the whole sky, where snow-white tufts grade into denser shaded rows.'
    },
    species: 'cirrocumulus_fine', sunEl: 38, sunAz: -0.28, showMoon: false, moonEl: 0.42, moonAz: 0.48, moonPhase: 0.55, lunarEc: 0.0, showPlane: false, cov: 0.56, tone: 'mixed', dark: 0.52
  },
  {
    id: 'theme_sunset_streets',
    title: { ru: '🌊 Облачные гряды на золотом закате', en: '🌊 Cloud rolls at golden sunset' },
    tag: { ru: 'Altocumulus undulatus • Закат', en: 'Altocumulus undulatus • Sunset' },
    desc: {
      ru: 'Параллельные волнистые гряды и валы, вспыхивающие золотисто-оранжевым светом у горизонта.',
      en: 'Parallel undulating rolls glowing gold and orange near the horizon.'
    },
    species: 'altocumulus_undulatus', sunEl: 4, sunAz: -0.12, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 0.65, lunarEc: 0.0, showPlane: false, cov: 0.56, tone: 'mixed', dark: 0.58
  },
  {
    id: 'theme_golden_sunset',
    title: { ru: '🌅 Розово-золотой закат с перистыми', en: '🌅 Pink-gold sunset with cirrus' },
    tag: { ru: 'Золотой час 360° • Закат', en: 'Golden hour 360° • Sunset' },
    desc: {
      ru: 'Низкое оранжевое Солнце у горизонта, фиолетово-синий зенит и облака в розово-золотом свечении.',
      en: 'A low orange Sun on the horizon, a violet-blue zenith and clouds glowing pink and gold.'
    },
    species: 'cloud_in_veil', sunEl: 2, sunAz: -0.10, showMoon: false, moonEl: 0.40, moonAz: 0.42, moonPhase: 0.68, lunarEc: 0.0, showPlane: true, cov: 0.50, tone: 'mixed', dark: 0.50
  },
  {
    id: 'theme_contrail_cross',
    title: { ru: '✈️ Перекрёстные следы самолётов', en: '✈️ Crossing contrails' },
    tag: { ru: 'Cirrus homogenitus • Авиатрасса', en: 'Cirrus homogenitus • Air corridor' },
    desc: {
      ru: 'Несколько пересекающихся широких пушистых следов лайнеров и «джамбо» в глубоком синем небе.',
      en: 'Several crossing, wide, fluffy contrails from airliners and jumbos in a deep blue sky.'
    },
    species: 'contrail_sky', sunEl: 38, sunAz: -0.35, showMoon: false, moonEl: 0.45, moonAz: 0.40, moonPhase: 0.50, lunarEc: 0.0, showPlane: true, cov: 0.52, tone: 'mixed', dark: 0.45
  },
  {
    id: 'theme_rain_storm',
    title: { ru: '🌧️ Тяжёлые дождевые тучи и ливень', en: '🌧️ Heavy rain clouds and downpour' },
    tag: { ru: 'Cumulonimbus • Ливень и молнии ⚡', en: 'Cumulonimbus • Rain and lightning ⚡' },
    desc: {
      ru: 'Свинцово-синие дождевые тучи, косые полосы проливного дождя у горизонта и грозовые разряды.',
      en: 'Leaden blue rain clouds, slanting rain shafts near the horizon and lightning flashes.'
    },
    species: 'storm_cb', sunEl: 22, sunAz: -0.20, showMoon: false, moonEl: 0.42, moonAz: 0.45, moonPhase: 1.00, lunarEc: 0.0, showPlane: false, cov: 0.76, tone: 'dark', dark: 0.90
  },
  {
    id: 'theme_daytime_moon',
    title: { ru: '🌙 Светлая дневная Луна в облаках', en: '🌙 Bright daytime Moon among clouds' },
    tag: { ru: 'Дневная Луна • День', en: 'Daytime Moon • Day' },
    desc: {
      ru: 'Яркая жемчужно-белая дневная Луна в окружении нежных полупрозрачных облаков.',
      en: 'A bright pearly daytime Moon surrounded by delicate translucent clouds.'
    },
    species: 'cloud_in_veil', sunEl: 34, sunAz: -0.45, showMoon: true, moonEl: 0.42, moonAz: 0.0, moonPhase: 1.00, lunarEc: 0.0, showPlane: false, cov: 0.44, tone: 'light', dark: 0.12
  },
  {
    id: 'theme_night_silver_clouds',
    title: { ru: '🌌 Ночные тучи в серебряном свете Луны', en: '🌌 Night clouds in silver moonlight' },
    tag: { ru: 'Ночная Луна • Серебряная кайма', en: 'Night Moon • Silver lining' },
    desc: {
      ru: 'Тёмно-сапфировые ночные кучевые облака и «барашки» с яркой серебристо-голубой лунной каймой.',
      en: 'Dark sapphire night cumulus and cirrocumulus with a bright silvery-blue lunar rim.'
    },
    species: 'altocumulus_floccus', sunEl: -20, sunAz: -0.5, showMoon: true, moonEl: 0.42, moonAz: 0.0, moonPhase: 0.98, lunarEc: 0.0, showPlane: false, cov: 0.54, tone: 'mixed', dark: 0.60
  },
  {
    id: 'theme_night_cirrus_stars',
    title: { ru: '🌠 Звёздная ночь 360° с перистыми', en: '🌠 Starry night 360° with cirrus' },
    tag: { ru: 'Млечный Путь + перистые нити', en: 'Milky Way + cirrus threads' },
    desc: {
      ru: 'Тонкие серебристые перистые нити, подсвеченные полной Луной на фоне звёзд и Млечного Пути.',
      en: 'Thin silvery cirrus threads lit by the full Moon against stars and the Milky Way.'
    },
    species: 'cirrus_classic', sunEl: -22, sunAz: -0.5, showMoon: true, moonEl: 0.40, moonAz: 0.12, moonPhase: 0.96, lunarEc: 0.0, showPlane: true, cov: 0.46, tone: 'light', dark: 0.20
  },
  {
    id: 'theme_blood_moon',
    title: { ru: '🩸 «Кровавая Луна» над алыми облаками', en: '🩸 Blood Moon over crimson clouds' },
    tag: { ru: 'Полное лунное затмение 🌙', en: 'Total lunar eclipse 🌙' },
    desc: {
      ru: 'Медно-багровая полная Луна над тёплыми кораллово-алыми облаками в вечерних сумерках.',
      en: 'A copper-red full Moon above warm coral clouds in the evening twilight.'
    },
    species: 'cumulus_summer', sunEl: -14, sunAz: -0.4, showMoon: true, moonEl: 0.42, moonAz: 0.0, moonPhase: 1.00, lunarEc: 1.0, showPlane: false, cov: 0.50, tone: 'mixed', dark: 0.55
  },
  {
    id: 'theme_solar_eclipse',
    title: { ru: '🌑 Полное солнечное затмение 360°', en: '🌑 Total solar eclipse 360°' },
    tag: { ru: 'Солнечная корона и протуберанцы', en: 'Solar corona and prominences' },
    desc: {
      ru: 'Луна полностью закрывает диск Солнца: жемчужная корона, рубиновые протуберанцы и зарево по всему горизонту.',
      en: 'The Moon completely covers the solar disc: a pearly corona, ruby prominences and a 360° twilight glow.'
    },
    species: 'cirrus_classic', sunEl: 26, sunAz: 0.0, showMoon: true, moonEl: 26 * Math.PI / 180 + 0.0002, moonAz: 0.002, moonPhase: 0.0, lunarEc: 0.0, showPlane: false, cov: 0.42, tone: 'mixed', dark: 0.48
  }
];
