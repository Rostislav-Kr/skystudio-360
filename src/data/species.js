// 12 cloud varieties. `modeId` selects the cloud-morphology branch in the fragment shader.
// Text fields are bilingual: { ru, en }.

export const SPECIES = [
  {
    id: 'cirrus_classic',
    modeId: 0.0,
    name: { ru: '1. ⭐ Перистые (Классик)', en: '1. ⭐ Cirrus (classic)' },
    sub: 'Cirrus fibratus',
    fullName: {
      ru: '1. ⭐ Шелковистые перистые нити (Cirrus fibratus — длинные ледяные волокна)',
      en: '1. ⭐ Silky cirrus threads (Cirrus fibratus — long ice fibres)'
    },
    hint: {
      ru: 'Длинные шелковистые ледяные нити на высоте около 9 км (время суток и тональность меняются отдельно, в верхней панели)',
      en: 'Long silky ice threads at about 9 km (time of day and tone are set separately in the top bar)'
    },
    phys: {
      lcl: 8.2, el: 9.8, cape: 110,
      shear: { ru: 'Высокий (42 м/с)', en: 'Strong (42 m/s)' },
      phase: { ru: 'Кристаллы льда −44°C', en: 'Ice crystals −44°C' },
      mech: { ru: 'Десублимация пара + струйное течение', en: 'Vapour deposition + jet stream' },
      desc: {
        ru: 'На высоте около 9 км водяной пар десублимирует в гексагональные кристаллы льда, а сильный высотный ветер вытягивает их в длинные параллельные шелковистые волокна.',
        en: 'At about 9 km water vapour deposits directly into hexagonal ice crystals, and strong upper-level winds stretch them into long parallel silky fibres.'
      }
    },
    params: { coverage: 0.52, scale: 1.00, detail: 0.92, contrast: 0.84, shear: 0.55 }
  },
  {
    id: 'cirrus_uncinus',
    modeId: 1.0,
    name: { ru: '2. 🪶 Перистые «Хвосты»', en: "2. 🪶 Mare's tails" },
    sub: 'Cirrus uncinus',
    fullName: {
      ru: '2. 🪶 Перистые когтевидные «конские хвосты» (Cirrus uncinus — загнутые ледяные перья)',
      en: "2. 🪶 Hooked cirrus “mare's tails” (Cirrus uncinus — curled ice plumes)"
    },
    hint: {
      ru: 'Падающие кристаллы льда попадают в зону сдвига ветра и загибаются крючками',
      en: 'Falling ice crystals enter a wind-shear zone and curl into hooks'
    },
    phys: {
      lcl: 7.8, el: 9.5, cape: 140,
      shear: { ru: 'Сильный ∂V/∂z', en: 'Strong ∂V/∂z' },
      phase: { ru: 'Ледяные иглы −40°C', en: 'Ice needles −40°C' },
      mech: { ru: 'Гравитационное оседание льда в сдвиге ветра', en: 'Ice fall-out in wind shear' },
      desc: {
        ru: 'В головной части облака рождаются ледяные кристаллы; падая в нижние слои с другой скоростью ветра, они оставляют длинные загнутые хвосты-вирги.',
        en: 'Ice crystals form in the cloud head; falling into lower layers with a different wind speed, they leave long curved fall-streak (virga) tails.'
      }
    },
    params: { coverage: 0.50, scale: 1.00, detail: 0.92, contrast: 0.85, shear: 0.65 }
  },
  {
    id: 'cirrus_vertebratus',
    modeId: 2.0,
    name: { ru: '3. 🦴 Перистые «Хребты»', en: '3. 🦴 Cirrus spines' },
    sub: 'Cirrus vertebratus',
    fullName: {
      ru: '3. 🦴 Хребтовидные перистые облака «рыбий скелет» (Cirrus vertebratus)',
      en: '3. 🦴 Fish-skeleton cirrus (Cirrus vertebratus)'
    },
    hint: {
      ru: 'Плотный осевой хребет струйного течения с расходящимися поперечными рёбрами',
      en: 'A dense jet-stream spine with ribs branching out to the sides'
    },
    phys: {
      lcl: 8.0, el: 10.2, cape: 180,
      shear: { ru: 'Ось струйного течения', en: 'Jet-stream axis' },
      phase: { ru: 'Кристаллы льда −46°C', en: 'Ice crystals −46°C' },
      mech: { ru: 'Гравитационные волны вдоль оси струйного течения', en: 'Gravity waves along the jet-stream axis' },
      desc: {
        ru: 'Короткие поперечные гравитационные волны вдоль оси высотного струйного течения формируют плотный ледяной хребет с расходящимися рёбрами.',
        en: 'Short transverse gravity waves along the axis of the upper-level jet stream form a dense ice spine with diverging ribs.'
      }
    },
    params: { coverage: 0.54, scale: 1.00, detail: 0.94, contrast: 0.86, shear: 0.60 }
  },
  {
    id: 'cumulus_summer',
    modeId: 3.0,
    name: { ru: '4. ☁️ Летние кучевые', en: '4. ☁️ Fair-weather cumulus' },
    sub: 'Cumulus humilis',
    fullName: {
      ru: '4. ☁️ Летние кучевые облака хорошей погоды (плоская база LCL и пышные купола)',
      en: '4. ☁️ Fair-weather cumulus (flat LCL base and puffy domes)'
    },
    hint: {
      ru: 'Классические кучевые облака термической конвекции',
      en: 'Classic cumulus from thermal convection'
    },
    phys: {
      lcl: 1.2, el: 2.6, cape: 480,
      shear: { ru: 'Слабый (8 м/с)', en: 'Weak (8 m/s)' },
      phase: { ru: 'Капли воды +12°C', en: 'Water droplets +12°C' },
      mech: { ru: 'Термическая конвекция от прогретой земли (z_LCL)', en: 'Thermal convection from heated ground (z_LCL)' },
      desc: {
        ru: 'Солнце нагревает землю; поднимающиеся термики остывают по сухой адиабате (9,8 °C/км) до точки росы на уровне LCL, формируя плоскую подошву и кипящие купола.',
        en: 'The Sun heats the ground; rising thermals cool at the dry adiabatic rate (9.8 °C/km) to the dew point at the LCL, forming a flat base and boiling domes.'
      }
    },
    params: { coverage: 0.52, scale: 1.00, detail: 0.90, contrast: 0.85, shear: 0.20 }
  },
  {
    id: 'cloud_in_veil',
    modeId: 4.0,
    name: { ru: '5. 🌤️ Облако в дымке', en: '5. 🌤️ Cumulus under a veil' },
    sub: { ru: 'Кучевые + Перистые', en: 'Cumulus + Cirrus' },
    fullName: {
      ru: '5. 🌤️ Пушистые кучевые облака на фоне шелковистой перистой вуали (двухслойное небо)',
      en: '5. 🌤️ Puffy cumulus beneath a silky cirrus veil (two-layer sky)'
    },
    hint: {
      ru: 'Два физических яруса одновременно — кучевые (1,5 км) и ледяная вуаль (9 км)',
      en: 'Two physical layers at once — cumulus (1.5 km) and an ice veil (9 km)'
    },
    phys: {
      lcl: 1.4, el: 9.2, cape: 540,
      shear: { ru: 'Двухслойный', en: 'Two-layer' },
      phase: { ru: 'Капли внизу + лёд вверху', en: 'Droplets below + ice above' },
      mech: { ru: 'Термики нижнего яруса под высотным струйным течением', en: 'Low-level thermals beneath the upper jet stream' },
      desc: {
        ru: 'В нижнем километре развиваются тёплые водяные кучевые облака, а на высоте 9 км над ними простирается тонкая пелена ледяных кристаллов.',
        en: 'Warm water-droplet cumulus develops in the lowest kilometre, while a thin sheet of ice crystals spreads above it at 9 km.'
      }
    },
    params: { coverage: 0.54, scale: 1.00, detail: 0.90, contrast: 0.84, shear: 0.45 }
  },
  {
    id: 'cirrocumulus_fine',
    modeId: 5.0,
    name: { ru: '6. 🐑 Мелкие «Барашки»', en: '6. 🐑 Fine cirrocumulus' },
    sub: 'Cirrocumulus undulatus',
    fullName: {
      ru: '6. 🐑 Высотная сотовая рябь «барашки» рядами (Cirrocumulus undulatus)',
      en: '6. 🐑 High-altitude cellular ripples in rows (Cirrocumulus undulatus)'
    },
    hint: {
      ru: 'Тысячи мелких белых комочков, выстроенных диагональными волнами на высоте 7 км',
      en: 'Thousands of small white tufts in diagonal waves at 7 km'
    },
    phys: {
      lcl: 6.6, el: 7.8, cape: 260,
      shear: { ru: 'Волновой (24 м/с)', en: 'Wavy (24 m/s)' },
      phase: { ru: 'Лёд + переохл. капли −32°C', en: 'Ice + supercooled drops −32°C' },
      mech: { ru: 'Микроконвекция Рэлея — Бенара на высоте 7 км', en: 'Rayleigh–Bénard micro-convection at 7 km' },
      desc: {
        ru: 'Радиационное охлаждение верхушки тонкого высотного слоя запускает тысячи мелких ячеек конвекции: в центре каждой ячейки облачко растёт, а по краям испаряется.',
        en: 'Radiative cooling at the top of a thin high layer triggers thousands of tiny convection cells: the cloudlet grows in each cell centre and evaporates at the edges.'
      }
    },
    params: { coverage: 0.58, scale: 1.00, detail: 0.95, contrast: 0.86, shear: 0.35 }
  },
  {
    id: 'altocumulus_floccus',
    modeId: 6.0,
    name: { ru: '7. 🐏 Крупные «Флоккус»', en: '7. 🐏 Altocumulus floccus' },
    sub: 'Altocumulus floccus',
    fullName: {
      ru: '7. 🐏 Густые хлопьевидные облака «флоккус» с окнами синего неба (Altocumulus floccus)',
      en: '7. 🐏 Dense tufted floccus with blue-sky gaps (Altocumulus floccus)'
    },
    hint: {
      ru: 'Пышные белые ватные хлопья среднего яруса (4 км)',
      en: 'Puffy cotton-wool tufts in the middle layer (4 km)'
    },
    phys: {
      lcl: 3.6, el: 5.0, cape: 420,
      shear: { ru: 'Умеренный (16 м/с)', en: 'Moderate (16 m/s)' },
      phase: { ru: 'Переохл. капли −14°C', en: 'Supercooled drops −14°C' },
      mech: { ru: 'Локальная неустойчивость среднего яруса', en: 'Local mid-level instability' },
      desc: {
        ru: 'Выделение скрытой теплоты конденсации в среднем ярусе (4 км) создаёт пушистые куполообразные хлопья с рваными краями из-за испарения выпадающих капель.',
        en: 'Latent heat released by condensation in the middle layer (4 km) builds fluffy dome-shaped tufts with ragged edges where falling drops evaporate.'
      }
    },
    params: { coverage: 0.58, scale: 1.00, detail: 0.94, contrast: 0.85, shear: 0.30 }
  },
  {
    id: 'altocumulus_lacunosus',
    modeId: 11.0,
    name: { ru: '8. 🫧 Ажурные «Лакуны»', en: '8. 🫧 Lacunosus' },
    sub: 'Cirrocumulus lacunosus',
    fullName: {
      ru: '8. 🫧 Перисто-кучевые «лакунозус» с круглыми окнами испарения и волокнами',
      en: '8. 🫧 Lacunosus cirrocumulus with round evaporation holes and fibres'
    },
    hint: {
      ru: 'Ажурный слой хлопьев с круглыми голубыми «проталинами» нисходящих потоков',
      en: 'A lacy layer of tufts with round blue holes punched by downdrafts'
    },
    phys: {
      lcl: 5.8, el: 7.2, cape: 310,
      shear: { ru: 'Умеренный (20 м/с)', en: 'Moderate (20 m/s)' },
      phase: { ru: 'Смешанная фаза −26°C', en: 'Mixed phase −26°C' },
      mech: { ru: 'Нисходящие термики испарения (lacunosus)', en: 'Evaporative downdrafts (lacunosus)' },
      desc: {
        ru: 'Холодные нисходящие струи сухого воздуха сверху пробивают облачный пласт, локально нагреваясь по адиабате и «выжигая» круглые голубые окна распада.',
        en: 'Cold dry downdrafts from above punch through the cloud sheet, warming adiabatically and “burning” round blue holes.'
      }
    },
    params: { coverage: 0.58, scale: 1.00, detail: 0.95, contrast: 0.84, shear: 0.45 }
  },
  {
    id: 'altocumulus_undulatus',
    modeId: 7.0,
    name: { ru: '9. 🌊 Облачные гряды', en: '9. 🌊 Cloud rolls' },
    sub: 'Altocumulus undulatus',
    fullName: {
      ru: '9. 🌊 Высококучевые волнистые гряды и улицы (Altocumulus undulatus)',
      en: '9. 🌊 Undulating altocumulus rolls and streets (Altocumulus undulatus)'
    },
    hint: {
      ru: 'Параллельные облачные валы на гребнях внутренних гравитационных волн',
      en: 'Parallel cloud rolls on the crests of internal gravity waves'
    },
    phys: {
      lcl: 3.1, el: 4.4, cape: 360,
      shear: { ru: 'Волновой сдвиг', en: 'Wave shear' },
      phase: { ru: 'Капли воды −8°C', en: 'Water droplets −8°C' },
      mech: { ru: 'Внутренние гравитационные волны на границе слоёв', en: 'Internal gravity waves at a layer interface' },
      desc: {
        ru: 'На границе двух воздушных слоёв разной плотности возникают стоячие и бегущие волны: на гребнях воздух поднимается выше LCL (облачный вал), во впадинах — просвет.',
        en: 'Standing and travelling waves form at the boundary between two air layers of different density: on the crests air rises above the LCL (a cloud roll), in the troughs the sky clears.'
      }
    },
    params: { coverage: 0.56, scale: 1.00, detail: 0.90, contrast: 0.86, shear: 0.50 }
  },
  {
    id: 'cumulus_congestus',
    modeId: 8.0,
    name: { ru: '10. ⛅ Мощные кучевые', en: '10. ⛅ Towering cumulus' },
    sub: 'Cumulus congestus',
    fullName: {
      ru: '10. ⛅ Мощные кучевые башни Cumulus congestus с серебристой каймой Ми',
      en: '10. ⛅ Towering Cumulus congestus with a silver Mie lining'
    },
    hint: {
      ru: 'Взмывающие ввысь кипящие купола «цветной капусты» с глубокими тенями',
      en: 'Soaring cauliflower domes with deep shadows'
    },
    phys: {
      lcl: 0.9, el: 5.8, cape: 1350,
      shear: { ru: 'Умеренный (18 м/с)', en: 'Moderate (18 m/s)' },
      phase: { ru: 'Крупные капли 25–50 мкм', en: 'Large drops 25–50 µm' },
      mech: { ru: 'Влажноадиабатический разгон за счёт скрытой теплоты', en: 'Moist-adiabatic acceleration by latent heat' },
      desc: {
        ru: 'Выделение большого количества скрытой теплоты конденсации делает облачный столб значительно теплее среды, разгоняя восходящий поток до 15–20 м/с.',
        en: 'A large release of latent heat makes the cloud column much warmer than its surroundings, accelerating the updraft to 15–20 m/s.'
      }
    },
    params: { coverage: 0.56, scale: 0.92, detail: 0.92, contrast: 0.88, shear: 0.35 }
  },
  {
    id: 'storm_cb',
    modeId: 10.0,
    name: { ru: '11. 🌧️ Дождевые тучи', en: '11. 🌧️ Rain clouds' },
    sub: { ru: 'Ливень + Гроза ⚡', en: 'Downpour + thunder ⚡' },
    fullName: {
      ru: '11. 🌧️ Кучево-дождевые грозовые тучи (Cumulonimbus incus — покров до 92–100%, ливень и молнии)',
      en: '11. 🌧️ Thunderstorm cumulonimbus (Cumulonimbus incus — up to 92–100% cover, downpour and lightning)'
    },
    hint: {
      ru: 'Мощные грозовые тучи со стеной проливного дождя и молниями',
      en: 'Massive storm clouds with a wall of heavy rain and lightning'
    },
    phys: {
      lcl: 0.7, el: 10.8, cape: 2450,
      shear: { ru: 'Грозовой (32 м/с)', en: 'Storm (32 m/s)' },
      phase: { ru: 'Капли + град + наковальня льда', en: 'Drops + hail + ice anvil' },
      mech: { ru: 'Взрывная конвекция CAPE + запирающая тропопауза', en: 'Explosive CAPE-driven convection + capping tropopause' },
      desc: {
        ru: 'Мощный восходящий поток пробивает всю тропосферу до тропопаузы (10,8 км), растекаясь наковальней, а тяжёлые капли и градины обрушиваются вниз стеной ливня.',
        en: 'A powerful updraft punches through the whole troposphere to the tropopause (10.8 km), spreading into an anvil, while heavy drops and hail fall in a wall of rain.'
      }
    },
    params: { coverage: 0.76, scale: 1.00, detail: 0.92, contrast: 0.92, shear: 0.65 },
    isRainSpecies: true
  },
  {
    id: 'contrail_sky',
    modeId: 9.0,
    name: { ru: '12. ✈️ Авиатрасса', en: '12. ✈️ Air corridor' },
    sub: { ru: 'Следы самолётов', en: 'Aircraft contrails' },
    fullName: {
      ru: '12. ✈️ Перекрёстные инверсионные следы самолётов (Cirrus homogenitus)',
      en: '12. ✈️ Crossing aircraft contrails (Cirrus homogenitus)'
    },
    hint: {
      ru: 'Пересекающиеся пушистые конденсационные следы лайнеров на высоте 10–11 км',
      en: 'Crossing fluffy condensation trails of airliners at 10–11 km'
    },
    phys: {
      lcl: 9.5, el: 11.2, cape: 90,
      shear: { ru: 'Струйный (48 м/с)', en: 'Jet stream (48 m/s)' },
      phase: { ru: 'Ледяные кристаллы −52°C', en: 'Ice crystals −52°C' },
      mech: { ru: 'Конденсация выхлопа двигателей на ядрах сажи (homogenitus)', en: 'Engine exhaust condensing on soot nuclei (homogenitus)' },
      desc: {
        ru: 'Горячий водяной пар из двигателей самолёта на высоте 10–11 км мгновенно пересыщается и замерзает, а высотный сдвиг ветра превращает след в перистое облако.',
        en: 'Hot water vapour from aircraft engines at 10–11 km instantly becomes supersaturated and freezes, and upper-level wind shear turns the trail into a cirrus cloud.'
      }
    },
    params: { coverage: 0.48, scale: 1.00, detail: 0.90, contrast: 0.84, shear: 0.70 }
  }
];
