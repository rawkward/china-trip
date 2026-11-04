window.TRIP_ITINERARY = (function(){
"use strict";

const CITIES = {
  hk:  {label:"Гонконг",     color:"#0f766e"},
  cq:  {label:"Чунцин",      color:"#c2410c"},
  wl:  {label:"Улун",        color:"#4d7c0f"},
  bb:  {label:"Бэйбэй",      color:"#b45309"},
  cd:  {label:"Чэнду",       color:"#7c3aed"},
  zjj: {label:"Чжанцзяцзе",  color:"#0e7490"},
  fh:  {label:"Фэнхуан",     color:"#b91c1c"},
  fr:  {label:"Фужун",       color:"#a16207"},
  ls:  {label:"Лхаса",       color:"#6d28d9"},
  mc:  {label:"Макао",       color:"#047857"},
  gz:  {label:"Гуанчжоу",    color:"#be185d"},
  gl:  {label:"Гуйлинь",     color:"#15803d"},
  sh:  {label:"Шанхай",      color:"#1d4ed8"},
  hz:  {label:"Ханчжоу",     color:"#0d9488"},
  sz:  {label:"Сучжоу",      color:"#78716c"},
  sy:  {label:"Санья",       color:"#ea580c"},
  shenzhen: {label:"Шэньчжэнь", color:"#334155"},
  air: {label:"В пути",      color:"#64748b"},
};

const DATES = [
  "27.11 · пт","28.11 · сб","29.11 · вс","30.11 · пн","01.12 · вт","02.12 · ср","03.12 · чт",
  "04.12 · пт","05.12 · сб","06.12 · вс","07.12 · пн","08.12 · вт","09.12 · ср","10.12 · чт","11.12 · пт",
];

/* ==================== ЧУНЦИН ==================== */

const CQ_ARRIVAL = {city:"cq", title:"Прилёт в Чунцин", sub:"Ночной перелёт из Москвы → утро в Чунцине", places:[
  {k:"chongqing", name:"Прилёт в аэропорт Цзянбэй", tag:"transport", note:"Прямой ночной рейс из Москвы"},
  {k:"jiefangbei", name:"Заселение, Цзефанбэй", tag:"hotel", note:"Отель в центре — пешком до набережной"},
  {k:"hongya_cave", name:"Хунъядун", tag:"sight", note:"Подсветку включают к сумеркам, около 18:30"},
  {k:"jiefangbei", name:"Первый хотпот", tag:"food", note:"Просить «вэйла» — средняя острота", cost:"¥120–150"},
]};

const CQ_RAILS = {city:"cq", title:"Чунцин: рельсы и виды", sub:"Лицзыба, канатка через Янцзы, смотровые", places:[
  {k:"liziba", name:"Лицзыба", tag:"sight", note:"Монорельс сквозь жилой дом, смотровая на платформе"},
  {k:"eling", name:"Парк Элин", tag:"sight", note:"Бесплатно, вид на город и реку"},
  {k:"jiefangbei", name:"Обед: лапша сяомянь", tag:"food", note:"", cost:"¥12–15"},
  {k:"yangtze_cableway", name:"Канатка через Янцзы", tag:"sight", note:"Зимой работает до 21:00", cost:"¥30 / ¥50"},
  {k:"nanshan_cq", name:"Смотровая Наньшань", tag:"sight", note:"Лучше к закату — весь город в подсветке", cost:"¥30"},
  {k:"hongya_cave", name:"Хотпот 珮姐 (Peijie)", tag:"food", note:"В очередь к 17:30", cost:"¥120–150"},
  {k:"jiefangbei", name:"Дрон-шоу «Синьюнь Чунцин»", tag:"sight", note:"Субботы в 20:30 над двумя реками: смотреть с Наньбинь-роуд или Чаотяньмэня. Расписание на ноябрь публикуют за 1–2 недели"},
]};

const CQ_CIQIKOU = {city:"cq", title:"Чунцин: Цикоу и панды", sub:"Старый город с утра, зоопарк с пандами, вечерний хотпот", places:[
  {k:"ciqikou", name:"Цикоу (старый город)", tag:"sight", note:"Бесплатно, приходить к 8:30 — до толпы"},
  {k:"chongqing_zoo", name:"Зоопарк с пандами", tag:"sight", note:"", cost:"¥25"},
  {k:"nanshan_cq", name:"Смотровая Наньшань", tag:"sight", note:"Лучше к закату", cost:"¥30"},
  {k:"hongya_cave", name:"Хотпот в пещере 洞亭", tag:"food", note:"", cost:"¥100–130"},
]};

/* ==================== ФЭНХУАН И ФУЖУН ==================== */

const FENGHUANG_ARRIVE = {city:"fh", title:"Чунцин → Фэнхуан", sub:"Поезд через Хуайхуа, вечерняя подсветка старого города", places:[
  {k:"chongqing", name:"Поезд Чунцин-Запад → Фэнхуан", tag:"transport", note:"3 ч 50 – 4 ч 15, ~5 рейсов в день", cost:"¥311–339"},
  {k:"fenghuang", name:"Заселение в старом городе", tag:"hotel", note:"Гостевой дом у реки Томэнь (沱江), с балконом"},
  {k:"fenghuang", name:"Набережная Томэна и мост Хунцяо", tag:"sight", note:"Подсветку включают около 18:30 — это главное время"},
  {k:"fenghuang", name:"Ужин: кислый суп с рыбой", tag:"food", note:"Мяоская кухня, острота по запросу", cost:"¥60–90"},
]};

const FURONG_ARRIVE = {city:"fr", title:"Фэнхуан → Фужун", sub:"«Городок на водопаде», ночёвка с видом на воду", places:[
  {k:"fenghuang", name:"Утро в Фэнхуане: рынок и переулки", tag:"sight", note:"До 10:00 почти нет групп — лучшее время для фото"},
  {k:"furong", name:"Поезд Фэнхуан → Фужунчжэнь", tag:"transport", note:"Около 40 минут, станция в 15 мин от старого города"},
  {k:"furong", name:"Отель с видом на водопад", tag:"hotel", note:"Номера с балконом напротив водопада — бронировать сильно заранее"},
  {k:"furong", name:"Водопад и старый город", tag:"sight", note:"Вход в город платный, билет действует сутки", cost:"¥80–108"},
]};

const FURONG_BACK = {city:"wl", title:"Фужун → Чунцин → Улун", sub:"Переездной день: поезд, метро, поезд до Улуна", places:[
  {k:"furong", name:"Утро у водопада без людей", tag:"sight", note:"До 9:00 город почти пустой"},
  {k:"furong", name:"Поезд Фужунчжэнь → Чунцин-Запад", tag:"transport", note:"4–4,5 часа с пересадкой в Чжанцзяцзе-Западном", cost:"~¥340"},
  {k:"wulong", name:"Поезд Чунцин-Север → Улун", tag:"transport", note:"1,5–2 часа, билеты за 14 дней", cost:"¥25"},
  {k:"fairy_mountain", name:"Заселение в Сяньнюйшане", tag:"hotel", note:"Гестхаус ближе к парку — утром не ехать через город"},
]};

const WULONG_DAY = {city:"wl", title:"Улун: Три моста и ущелье", sub:"Тяньшэн саньцяо и Луншуйся за один день", places:[
  {k:"three_natural_bridges", name:"Тяньшэн саньцяо (Три природных моста)", tag:"sight", note:"Снимали «Трансформеры: Эпоха истребления» (2014) и «Проклятие золотого цветка»; «Аватар» тут ни при чём — его снимали в Чжанцзяцзе. 2–3 часа, утром меньше групп", cost:"¥125"},
  {k:"longshuixia", name:"Ущелье Луншуйся", tag:"sight", note:"Вход в 10 минутах от Трёх мостов, вниз по лестницам и мосткам", cost:"¥85"},
  {k:"furong_cave", name:"Пещера Фужун — если останутся силы", tag:"sight", note:"Сталактиты и подземное озеро с подсветкой; 30–40 минут в сторону Цзянкоу", cost:"¥120"},
]};

const WULONG_OUT = {city:"wl", title:"Улун → Чунцин → Гонконг", sub:"Утренний поезд, вечерний перелёт в Гонконг", places:[
  {k:"wulong", name:"Улун → Чунцин-Север", tag:"transport", note:"Поезд 1,5–2 часа, брать утренний"},
  {k:"chongqing", name:"Аэропорт Цзянбэй, перелёт в Гонконг", tag:"transport", note:"2 ч 15 мин; из Улуна до аэропорта с запасом 4 часа"},
  {k:"temple_street", name:"Заселение и ужин на Temple Street", tag:"food", note:"Глиняный горшок с рисом в Hing Kee", cost:"HK$80"},
]};

/* ==================== ЧЭНДУ И ТИБЕТ ==================== */

const CD_ARRIVE = {city:"cd", title:"Прилёт в Чэнду", sub:"Переулок Куаньчжайсян, чайные, первая ночь", places:[
  {k:"chengdu", name:"Перелёт Москва → Чэнду", tag:"transport", note:"Ночной рейс, утро в Чэнду"},
  {k:"chengdu", name:"Заселение, Куаньчжайсян", tag:"hotel", note:"Переулок с чайными и уличной едой"},
  {k:"chengdu", name:"Чайная с бамбуковыми стульями", tag:"food", note:"Сидеть час-два — местная норма", cost:"¥40"},
]};

const CD_PANDA = {city:"cd", title:"Чэнду: панды и Саньсиндуй", sub:"Ранний слот к пандам, бронза бронзового века", places:[
  {k:"panda_base", name:"Парк панд (утро)", tag:"sight", note:"Слот 7:30–8:00, билеты онлайн за 14 дней", cost:"¥55"},
  {k:"sanxingdui", name:"Музей Саньсиндуй (Гуанхань)", tag:"sight", note:"Электричка ~1 час, бронзовые маски и дерево", cost:"¥72"},
  {k:"chengdu", name:"Хотпот по-чэндуски", tag:"food", note:"Мягче чунцинского", cost:"¥100–140"},
]};

const LHASA_ARRIVE = {city:"ls", title:"Чэнду → Лхаса", sub:"Перелёт 2 ч 15, акклиматизация, Баркхор", places:[
  {k:"lhasa", name:"Перелёт Чэнду → Лхаса", tag:"transport", note:"2 ч 15, слева по борту Гималаи; пермит оформляет агентство", cost:"от ¥900"},
  {k:"barkhor", name:"Баркхор: первый круг", tag:"sight", note:"Высота 3 650 м — идти медленно, пить воду, не подниматься на Поталу в первый день"},
  {k:"lhasa", name:"Тибетский чай с маслом", tag:"food", note:"Обязательный ритуал акклиматизации", cost:"¥30"},
]};

const LHASA_POTALA = {city:"ls", title:"Лхаса: Потала и Джоканг", sub:"Дворец на холме, главный храм, вечерний Баркхор", places:[
  {k:"potala_palace", name:"Дворец Потала", tag:"sight", note:"Билеты по времени, очередь с паспортом; 2–3 часа", cost:"¥200"},
  {k:"jokhang", name:"Храм Джоканг", tag:"sight", note:"Самый почитаемый храм Тибета, рядом площадь", cost:"¥85"},
  {k:"barkhor", name:"Баркхор вечером", tag:"sight", note:"Паломники идут по кругу, лучший свет для фото"},
]};

const LHASA_SERA = {city:"ls", title:"Лхаса: Сэра и Норбулинка", sub:"Дебаты монахов, летний дворец далай-лам", places:[
  {k:"sera_monastery", name:"Монастырь Сэра", tag:"sight", note:"Дебаты монахов около 15:00 — главное зрелище", cost:"¥50"},
  {k:"norbulingka", name:"Норбулинка", tag:"sight", note:"Летний дворец и парк, спокойная прогулка", cost:"¥60"},
  {k:"lhasa", name:"Тибетский ужин", tag:"food", note:"Момо и тьяк-мясо", cost:"¥100"},
]};

const LHASA_BACK = {city:"cd", title:"Лхаса → Чэнду", sub:"Перелёт, вечер в городе", places:[
  {k:"lhasa", name:"Перелёт Лхаса → Чэнду", tag:"transport", note:"2 ч 15, утром"},
  {k:"chengdu", name:"Прогулка по Цзиньли", tag:"sight", note:"Улица с фонарями и едой, вход ¥0–50"},
  {k:"chengdu", name:"Последний хотпот", tag:"food", note:"", cost:"¥100–140"},
]};

const CD_TO_HK = {city:"hk", title:"Чэнду → Гонконг", sub:"Перелёт, заселение, вечер на Temple Street", places:[
  {k:"chengdu", name:"Перелёт Чэнду → Гонконг", tag:"transport", note:"2 ч 40, дневной"},
  {k:"yau_ma_tei", name:"Заселение, Jordan / Yau Ma Tei", tag:"hotel", note:"Метро 15 мин до набережной"},
  {k:"temple_street", name:"Ужин на Temple Street", tag:"food", note:"Глиняный горшок с рисом в Hing Kee", cost:"HK$80"},
]};

/* ==================== ЧЖАНЦЗЯЦЗЕ ==================== */

const ZJJ_ARRIVE = {city:"zjj", title:"Чунцин → Чжанцзяцзе", sub:"Поезд, заселение в Улинъюане", places:[
  {k:"zhangjiajie", name:"Поезд Чунцин-Запад → Чжанцзяцзе-Запад", tag:"transport", note:"Около 3 ч 15 или самолёт 1 час", cost:"¥180"},
  {k:"zhangjiajie", name:"Заселение, Улинъюань", tag:"hotel", note:"Жить ближе к восточным воротам парка"},
]};

const ZJJ_YUANJIAJIE = {city:"zjj", title:"Юаньцзяцзе: парк «Аватар»", sub:"Лифт Байлун, мост Первого кадра, тропы", places:[
  {k:"zhangjiajie", name:"Лифт Байлун + мост Первого кадра", tag:"sight", note:"Билет в парк на 4 дня, очереди с 9:00; именно эти горы снимали в «Аватаре»", cost:"¥227"},
  {k:"zhangjiajie", name:"Тропа Цзиньбяньси", tag:"sight", note:"5 км по ручью, зимой скользко"},
]};

const ZJJ_CANYON = {city:"zjj", title:"Большой каньон и стеклянный мост", sub:"Тот самый подвесной мост над ущельем", places:[
  {k:"grand_canyon", name:"Стеклянный мост Чжанцзяцзе", tag:"sight", note:"415 м над ущельем, 300 м в длину; билет на вход в каньон и мост — один", cost:"¥178–296"},
  {k:"grand_canyon", name:"Прогулка по дну каньона", tag:"sight", note:"Ручей, водопады, 2–3 часа вниз и по мосткам"},
  {k:"zhangjiajie", name:"Вечер в Улинъюане", tag:"food", note:"Уличные шашлычки у реки", cost:"¥60–90"},
  {k:"tianmen", name:"Мюзикл «Тяньмэнь Хусянь»", tag:"sight", note:"Открытая сцена у подножия Тяньмэня, 20:20–22:00, световые эффекты. Тот самый «лазер» — это он, а не шоу на горе", cost:"¥238"},
]};

const ZJJ_TIANMEN = {city:"zjj", title:"Тяньмэньшань", sub:"«Небесные врата», стеклянная тропа, 999 ступеней", places:[
  {k:"tianmen", name:"Канатка на Тяньмэньшань", tag:"sight", note:"Самая длинная в мире, 7,5 км; билет включает канатки и автобус", cost:"¥278"},
  {k:"tianmen", name:"Стеклянная тропа и 999 ступеней", tag:"sight", note:"Спуск по ступеням к арке; скользко в сырость"},
  {k:"zhangjiajie", name:"Вечер в городе: Даюн гучэн", tag:"food", note:"Восстановленный старый квартал с едой, 20 минут от нижней станции канатки", cost:"¥60–90"},
]};

const ZJJ_TO_HK = {city:"hk", title:"Чунцин → Гонконг", sub:"Утренний перелёт, заселение, вечер в Ковлуне", places:[
  {k:"chongqing", name:"Перелёт Чунцин → Гонконг", tag:"transport", note:"2 ч 15, утренний"},
  {k:"yau_ma_tei", name:"Заселение, Jordan / Yau Ma Tei", tag:"hotel", note:"Метро 15 мин до набережной"},
  {k:"temple_street", name:"Temple Street вечером", tag:"food", note:"", cost:"HK$80"},
]};

/* ==================== ГОНКОНГ (общие дни) ==================== */

const HK_KOWLOON = {city:"hk", title:"Ковлун: M+ и набережная", sub:"Музеи, Avenue of Stars, вечерний свет", places:[
  {k:"tsim_sha_tsui", name:"Музей M+", tag:"sight", note:"Закрыт по понедельникам", cost:"HK$190"},
  {k:"tsim_sha_tsui", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно"},
  {k:"avenue_of_stars", name:"Avenue of Stars + паром Star Ferry", tag:"sight", note:"", cost:"~HK$5"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная гавани"},
]};

const HK_CENTRAL = {city:"hk", title:"Централ и Пик", sub:"Эскалатор, арт-кварталы, храм, вершина", places:[
  {k:"central_hk", name:"Эскалатор Central–Mid-Levels", tag:"sight", note:"Самый длинный крытый эскалатор в мире"},
  {k:"central_hk", name:"PMQ + Tai Kwun", tag:"sight", note:"Арт-кварталы, вход бесплатный"},
  {k:"central_hk", name:"Храм Man Mo", tag:"sight", note:"Бесплатно"},
  {k:"victoria_peak", name:"Пик (Victoria Peak)", tag:"sight", note:"Трамвай Peak Tram, лучше к закату", cost:"HK$116"},
  {k:"central_hk", name:"Еда: Lan Fong Yuen / Mak's Noodle", tag:"food", note:"", cost:"~HK$60"},
  {k:"mong_kok", name:"Mong Kok вечером", tag:"shopping", note:"Рынки и мелочи — обычно заходит больше, чем моллы"},
]};

const HK_LANTAU = {city:"hk", title:"Лантау: Будда и Tai O", sub:"Канатка, Большой Будда, свайная деревня", places:[
  {k:"ngong_ping", name:"Канатка Ngong Ping 360", tag:"transport", note:"Туда-обратно, онлайн дешевле", cost:"HK$295"},
  {k:"tian_tan_buddha", name:"Большой Будда (Tian Tan)", tag:"sight", note:"268 ступеней к статуе"},
  {k:"tai_o", name:"Деревня Tai O", tag:"sight", note:"Свайные дома, морепродукты, лодки"},
]};

const HK_DISNEY = {city:"hk", title:"Диснейленд", sub:"Понедельник — низкий тариф и короткие очереди", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор", cost:"HK$639"},
]};

const HK_SAIKUNG = {city:"hk", title:"Сайкунг и море", sub:"Рыбный рынок, лодки, морепродукты", places:[
  {k:"sai_kung", name:"Набережная и рынок Сайкунга", tag:"sight", note:"Лодки к островам, 1–2 часа на воде", cost:"HK$150"},
  {k:"sai_kung", name:"Обед из морепродуктов", tag:"food", note:"Выбрать в аквариуме, готовят рядом", cost:"HK$250–400"},
]};

const HK_SHOP = {city:"hk", title:"Шоппинг", sub:"Causeway Bay и Mong Kok, рождественские витрины", places:[
  {k:"mong_kok", name:"Causeway Bay + Harbour City", tag:"shopping", note:"Витрины с 20.11"},
  {k:"mong_kok", name:"Mong Kok: рынки и мелочи", tag:"shopping", note:"Женщинам обычно заходит больше, чем моллы"},
  {k:"tsim_sha_tsui", name:"Прощальный ужин Yardbird / Ho Lee Fook", tag:"food", note:"", cost:"HK$600–700"},
]};

const HK_FREE = {city:"hk", title:"Свободный день в Гонконге", sub:"Без плана: рынки, чайные, набережная", places:[
  {k:"central_hk", name:"Централ без спешки", tag:"sight", note:"Чайная, книжный, галереи"},
  {k:"victoria_harbour", name:"Вечер на набережной", tag:"sight", note:"Tsim Sha Tsui, вид на остров"},
]};

const HK_DISNEY_DAY = {city:"hk", title:"Диснейленд и прощальный ужин", sub:"Будний день — низкий тариф и короткие очереди", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор; будний день дешевле и свободнее", cost:"HK$639"},
  {k:"mong_kok", name:"Прощальный ужин Yardbird / Ho Lee Fook", tag:"food", note:"Бронировать за неделю", cost:"HK$600–700"},
]};

const HK_DEPART = {city:"hk", title:"Вылет домой", sub:"Утро на рынках, ночной рейс", places:[
  {k:"mong_kok", name:"Утро: рынки и сувениры", tag:"shopping", note:"Mong Kok и Causeway Bay — докупить подарки", cost:""},
  {k:"hongkong", name:"Ночной рейс Гонконг → Москва", tag:"transport", note:"Дома 11.12, отдых 12–13.12, на работу 14.12"},
]};

/* фестивальные дни — только в первом варианте */
const HK_FEST_ARRIVE = {city:"hk", title:"Перелёт в Гонконг", sub:"Чунцин → Гонконг, заселение, вечер в Ковлуне", places:[
  {k:"chongqing", name:"Перелёт Чунцин → Гонконг", tag:"transport", note:"2 ч 15"},
  {k:"yau_ma_tei", name:"Заселение, Jordan / Yau Ma Tei", tag:"hotel", note:"До Central Harbourfront — метро 15 мин"},
  {k:"temple_street", name:"Ужин на Temple Street", tag:"food", note:"Глиняный горшок с рисом в Hing Kee", cost:"HK$80"},
  {k:"central_harbourfront", name:"Clockenflap: по желанию, 2–3 часа", tag:"optional", note:"Ответвление на вечер: зайти на конкретные группы, полный день не берём — главный день 6.12", cost:"билет"},
]};

const HK_FEST_KOWLOON = {city:"hk", title:"Ковлун: M+ и набережная", sub:"Музеи, Avenue of Stars, вечерний свет", places:[
  {k:"tsim_sha_tsui", name:"Музей M+", tag:"sight", note:"Закрыт по понедельникам — поэтому суббота", cost:"HK$190"},
  {k:"tsim_sha_tsui", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно"},
  {k:"avenue_of_stars", name:"Avenue of Stars + Star Ferry", tag:"sight", note:"", cost:"~HK$5"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная гавани"},
  {k:"mong_kok", name:"Causeway Bay и Harbour City", tag:"shopping", note:"Витрины с 20.11; вечером после набережной"},
  {k:"central_harbourfront", name:"Clockenflap: по желанию, вечер", tag:"optional", note:"Если понравилось 4.12 — зайти на пару сетов; иначе вечер свободен", cost:"билет"},
]};

const HK_FEST_MAIN = {city:"hk", title:"Clockenflap: главный день", sub:"6 декабря — закрытие фестиваля. Дата зафиксирована", places:[
  {k:"central_harbourfront", name:"Clockenflap: день 3, закрытие", tag:"festival", note:"Сцены с полудня до 23:00, расписание за месяц на clockenflap.com", cost:"билет"},
  {k:"central_hk", name:"Обед в Централе до открытия", tag:"food", note:"", cost:"~HK$80"},
  {k:"victoria_harbour", name:"Обратно через Star Ferry", tag:"transport", note:"Последний паром около 23:00 — проверить в день фестиваля"},
]};

/* ==================== МАКАО ==================== */

const MACAU_ARRIVE = {city:"mc", title:"Гонконг → Макао", sub:"Паром 1 час, Сенадо-сквер, руины Св. Павла", places:[
  {k:"macau", name:"Паром Гонконг → Макао", tag:"transport", note:"1 час из Kowloon / Sheung Wan, каждые 15–30 мин", cost:"HK$160–200"},
  {k:"senado_square", name:"Сенадо-сквер и старый город", tag:"sight", note:"Португальская плитка, собор, улочки — всё пешком"},
  {k:"st_pauls", name:"Руины собора Св. Павла", tag:"sight", note:"Главная открытка Макао, к вечеру меньше людей"},
  {k:"macau", name:"Ужин: португальская кухня", tag:"food", note:"Африканская курица, треска", cost:"MOP 200–300"},
]};

const MACAU_CITY = {city:"mc", title:"Макао: крепость, центр, казино", sub:"Гуя, Венетка, Тайпа", places:[
  {k:"guia_fortress", name:"Крепость Гуя и маяк", tag:"sight", note:"Самый высокий холм, вид на весь город", cost:"бесплатно"},
  {k:"venetian_macau", name:"Венетка и Котай", tag:"sight", note:"Каналы под крышей, шоппинг, вечерняя подсветка"},
  {k:"taipa", name:"Тайпа: старые дома и еда", tag:"food", note:"Минчи (葡挞) и местные кондитерские", cost:"MOP 60–100"},
]};

const MACAU_BACK = {city:"mc", title:"Макао → Гонконг", sub:"Утро в Колоане, паром обратно", places:[
  {k:"macau", name:"Колоан: деревня и пляж", tag:"sight", note:"Тихая португальская часть, кофе на набережной"},
  {k:"macau", name:"Паром обратно в Гонконг", tag:"transport", note:"Вечерний, 1 час", cost:"HK$160–200"},
]};

const HK_SHOP2 = {city:"hk", title:"Шоппинг и прощальный ужин", sub:"Causeway Bay, Harbour City, вечер с видом", places:[
  {k:"mong_kok", name:"Causeway Bay + Harbour City", tag:"shopping", note:"Рождественские витрины"},
  {k:"tsim_sha_tsui", name:"Прощальный ужин с видом на гавань", tag:"food", note:"Бронировать за неделю", cost:"HK$600–700"},
]};

const HK_FEST_ARRIVE_NOFEST_PLACEHOLDER = {city:"hk", title:"Прилёт в Гонконг", sub:"Заселение в Джордане, вечер на Temple Street", places:[
  {k:"hongkong", name:"Перелёт Москва → Гонконг", tag:"transport", note:"Прямой ночной рейс"},
  {k:"yau_ma_tei", name:"Заселение, Jordan / Yau Ma Tei", tag:"hotel", note:"Метро 15 мин до набережной"},
  {k:"temple_street", name:"Ужин на Temple Street", tag:"food", note:"Глиняный горшок с рисом в Hing Kee", cost:"HK$80"},
]};

const MACAU_TAIPA = {city:"mc", title:"Макао: Тайпа и Котай", sub:"Старые дома, кондитерские, вечерние казино", places:[
  {k:"taipa", name:"Тайпа: улицы и кондитерские", tag:"sight", note:"Минчи и местные сладости, португальские фасады"},
  {k:"venetian_macau", name:"Котай вечером", tag:"sight", note:"Каналы под крышей и подсветка — бесплатно зайти"},
]};


/* ==================== ТИБЕТ: ЯМДРОК, ГЬЯНГДЗЕ, ШИГАДЗЕ ==================== */

const LHASA_YAMDROK = {city:"ls", title:"Лхаса → Ямдрок → Гьянгдзе", sub:"Бирюзовое озеро и перевал Камба-ла", places:[
  {k:"yamdrok_lake", name:"Озеро Ямдрок (Yamdrok Tso)", tag:"sight", note:"Перевал Камба-ла 4 994 м — фотопауза, идти медленно", cost:"¥60"},
  {k:"pelkor_chode", name:"Монастырь Пелкор-Чоде и Кумбум", tag:"sight", note:"Ступа со 108 часовнями в Гьянгдзе", cost:"¥60"},
  {k:"lhasa", name:"Ночь в Гьянгдзе", tag:"hotel", note:"Маленький город, 4 000 м — без долгих прогулок"},
]};

const GYANTSE_SHIGATSE = {city:"ls", title:"Гьянгдзе → Шигадзе", sub:"Второй город Тибета, монастырь Ташилунпо", places:[
  {k:"tashilhunpo", name:"Монастырь Ташилунпо", tag:"sight", note:"Резиденция Панчен-ламы, 3 800 м; 2–3 часа", cost:"¥80"},
  {k:"lhasa", name:"Старый город Шигадзе", tag:"sight", note:"Рынок и улочки вокруг крепости"},
]};

const SHIGATSE_LHASA = {city:"ls", title:"Шигадзе → Лхаса", sub:"Дорога вдоль Брахмапутры, прощальный круг по Баркхору", places:[
  {k:"lhasa", name:"Дорога Шигадзе → Лхаса", tag:"transport", note:"4–5 часов, около 250 км"},
  {k:"barkhor", name:"Вечерний Баркхор", tag:"sight", note:"Прощальный круг вместе с паломниками"},
]};

/* ==================== ЧЭНДУ: ЛЭШАНЬ И ЭМЭЙШАНЬ ==================== */

const CD_LESHAN = {city:"cd", title:"Лэшань: Большой Будда", sub:"Поезд 1 час, статуя в скале", places:[
  {k:"leshan", name:"Большой Будда в Лэшане", tag:"sight", note:"71 метр, высечен в скале; 3–4 часа с очередью", cost:"¥80"},
  {k:"chengdu", name:"Возвращение в Чэнду, ужин", tag:"food", note:"Улица Цзиньли, если останутся силы"},
]};

const CD_EMEI_UP = {city:"cd", title:"Эмэйшань: подъём", sub:"Поезд до Эмэйшаня, канатка, Золотая вершина", places:[
  {k:"emeishan", name:"Золотая вершина Эмэйшаня", tag:"sight", note:"3 099 м, статуя Самэнтхонга; зимой снег и ветер", cost:"¥160 + канатка ¥120"},
  {k:"emeishan", name:"Обезьяны на тропе Цинъинь", tag:"sight", note:"Не показывать еду — выхватывают"},
  {k:"chengdu", name:"Ночь в Эмэйшане", tag:"hotel", note:"Гостевой дом у подножия"},
]};

const CD_EMEI_DOWN = {city:"cd", title:"Эмэйшань → Чэнду", sub:"Спуск, поезд назад, вечер в городе", places:[
  {k:"emeishan", name:"Спуск и храм Баого", tag:"sight", note:"Утренний свет, мало людей"},
  {k:"chengdu", name:"Поезд Эмэйшань → Чэнду", tag:"transport", note:"1,5 часа"},
]};

const CD_FREE = {city:"cd", title:"Чэнду без плана", sub:"Чайные, рынки, шоппинг", places:[
  {k:"chengdu", name:"Чайная с бамбуковыми стульями", tag:"food", note:"Посидеть два часа — местная норма", cost:"¥40"},
  {k:"chengdu", name:"Рынок и сувениры", tag:"shopping", note:"Перец, чай, соусы — домой"},
]};

const CD_DEPART = {city:"cd", title:"Вылет домой", sub:"Аэропорт Шуанлю, дневной рейс", places:[
  {k:"chengdu", name:"Перелёт Чэнду → Москва", tag:"transport", note:"Дома 11.12, отдых 12–13.12"},
]};

/* ==================== ЧЖАНЦЗЯЦЗЕ: ВТОРОЙ БЛОК ==================== */

const ZJJ_BAOFENG = {city:"zjj", title:"Бофэн и Хуанлун", sub:"Озеро в горах и пещера с подсветкой", places:[
  {k:"zhangjiajie", name:"Озеро Бофэн", tag:"sight", note:"Лодка по ущелью между скалами, 1,5 часа", cost:"¥108"},
  {k:"zhangjiajie", name:"Пещера Хуанлун", tag:"sight", note:"Подземный дворец с подсветкой, 2 часа", cost:"¥118"},
]};

const ZJJ_BACK_CQ = {city:"cq", title:"Чжанцзяцзе → Чунцин", sub:"Поезд, вечер в городе", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе → Чунцин", tag:"transport", note:"3 ч 15, дневной", cost:"¥180"},
  {k:"hongya_cave", name:"Хунъядун вечером", tag:"sight", note:"Подсветка до 22:00"},
]};

const CQ_CIQIKOU_SHOP = {city:"cq", title:"Цикоу и шоппинг", sub:"Старый город утром, моллы вечером", places:[
  {k:"ciqikou", name:"Цикоу (старый город)", tag:"sight", note:"К 8:30, до толпы; чай и сладости"},
  {k:"jiefangbei", name:"Цзефанбэй: IFS и Metropolitan Plaza", tag:"shopping", note:"Бренды дороже Гонконга — брать только то, чего нет дома"},
  {k:"hongya_cave", name:"Прощальный хотпот", tag:"food", note:"", cost:"¥120–150"},
]};

const BEIBEI_ARRIVE = {city:"bb", title:"Чунцин → Бэйбэй", sub:"Метро 40 минут, спа-отель", places:[
  {k:"beibei", name:"Метро линия 6 до Бэйбэя", tag:"transport", note:"40 минут от центра"},
  {k:"beibei", name:"Отель с горячими источниками", tag:"spa", note:"Заселение, вечер в бассейне"},
]};

const BEIBEI_SPA = {city:"bb", title:"Бэйбэй: Цзиньюньшань и источники", sub:"Бамбук, тропы, храм, массаж", places:[
  {k:"jinyun_mountain", name:"Цзиньюньшань", tag:"sight", note:"Бамбук и храм, 2–3 часа"},
  {k:"beibei", name:"Горячие источники + массаж", tag:"spa", note:"День не экономим"},
]};

const BEIBEI_BACK = {city:"cq", title:"Бэйбэй → Чунцин", sub:"Возврат в город, свободный вечер", places:[
  {k:"beibei", name:"Метро обратно в Чунцин", tag:"transport", note:"40 минут"},
  {k:"jiefangbei", name:"Свободный вечер в Цзефанбэе", tag:"shopping", note:"Витрины и еда"},
]};

const CQ_SHOP_FINAL = {city:"cq", title:"Чунцин: прощальный день", sub:"Рынки, сборы, последний хотпот", places:[
  {k:"jiefangbei", name:"Гуаньиньцяо и рынки", tag:"shopping", note:"Чай, перец, сладости — домой"},
  {k:"hongya_cave", name:"Прощальный ужин у реки", tag:"food", note:"", cost:"¥120–150"},
]};

const CQ_DEPART = {city:"cq", title:"Вылет домой", sub:"Аэропорт Цзянбэй", places:[
  {k:"chongqing", name:"Перелёт Чунцин → Москва", tag:"transport", note:"Дома 11.12, отдых 12–13.12"},
]};

/* ==================== ХУНАНЬ: ФЭНХУАН, ФУЖУН, ЧЖАНЦЗЯЦЗЕ ==================== */

/* прилёт: рейс Москва → Чунцин (27.11), утро в Чунцине и поезд в Хунань (28.11) */
const HU_FLIGHT = {city:"cq", title:"Вылет из Москвы", sub:"GS7942, 15:35 из Шереметьево, ночь в воздухе", places:[
  {k:"chongqing", name:"Рейс GS7942 Москва → Чунцин", tag:"transport", note:"Вылет 15:35, прилёт 05:00 (TianJin Airlines, только вт и пт); 8 ч 25 в воздухе — спать в самолёте, в Чунцине ничего не смотрим"},
]};

const HU_FH_ARRIVE = {city:"fh", title:"Чунцин → Фэнхуан", sub:"Прилёт 05:00, поезд 4 часа, вечерняя подсветка Томэна", places:[
  {k:"chongqing", name:"Аэропорт Цзянбэй → вокзал Чунцин-Запад", tag:"transport", note:"Метро, около часа с пересадкой; брать поезд не раньше 8:00 — после ночного рейса нужен запас"},
  {k:"chongqing", name:"Поезд Чунцин-Запад → Фэнхуан", tag:"transport", note:"3 ч 50 – 4 ч 15, около 5 рейсов в день; Чунцин не смотрим — сразу в Хунань", cost:"¥311–339"},
  {k:"fenghuang", name:"Заселение в старом городе", tag:"hotel", note:"Гостевой дом у реки Томэнь, просить номер с балконом. Вход в город бесплатный, платные — усадьбы и лодка"},
  {k:"fenghuang", name:"Набережная Томэна вечером", tag:"sight", note:"Подсветку включают около 18:30 — ради этого сюда и едут"},
]};

const HU_FH_DAY = {city:"fh", title:"Фэнхуан: целый день на воде и в переулках", sub:"Рынок, лодка по Томэну, холм Наньхуа, подсветка", places:[
  {k:"fenghuang", name:"Утренний рынок у реки", tag:"food", note:"С 7:00: рисовая лапша, печёные каштаны, сладости", cost:"¥15–30"},
  {k:"fenghuang", name:"Лодка по Томэну", tag:"sight", note:"30–40 минут вдоль свайных домов; цену называть до посадки", cost:"¥80–120"},
  {k:"fenghuang", name:"Холм Наньхуашань и городская стена", tag:"sight", note:"Вид на черепичные крыши сверху, подъём около 20 минут", cost:"~¥50"},
  {k:"fenghuang", name:"Ужин: кислый суп с рыбой", tag:"food", note:"Мяоская кухня, остроту просить поменьше", cost:"¥60–90"},
  {k:"fenghuang", name:"Подсветка и мост Хунцяо", tag:"sight", note:"18:30–22:00; с балкона видно лучше, чем с набережной в толпе"},
]};

const HU_FURONG_DAY = {city:"fr", title:"Фужун и Красный каменный лес", sub:"Утро у водопада, геопарк Гучжан, второй вечер над водой", places:[
  {k:"furong", name:"Водопад до туристов", tag:"sight", note:"До 9:00 на мостках почти никого"},
  {k:"furong", name:"Красный каменный лес (红石林)", tag:"sight", note:"40–50 минут на машине, красный песчаник и чайные террасы; 2 часа на месте", cost:"~¥70"},
  {k:"furong", name:"Ущелье Цзолунся", tag:"sight", note:"Мостки между стенами ущелья, 1,5–2 часа; зимой сыро и скользко", cost:"~¥80"},
  {k:"furong", name:"Вечер над водопадом", tag:"food", note:"Ужин на балконе с видом на воду", cost:"¥60–90"},
]};

const HU_FURONG_TO_ZJJ = {city:"zjj", title:"Фужун → Чжанцзяцзе", sub:"Скоростной поезд, заселение в Улинъюане, Цзиньбяньси", places:[
  {k:"furong", name:"Поезд Фужун → Чжанцзяцзе-Запад", tag:"transport", note:"1–1,5 часа по линии Чжанцзяцзе — Цзишоу, станция в 15 минутах от старого города", cost:"¥60–80"},
  {k:"zhangjiajie", name:"Заселение, Улинъюань", tag:"hotel", note:"Жить ближе к восточным воротам парка — утром не ехать через город"},
  {k:"zhangjiajie", name:"Ручей Цзиньбяньси", tag:"sight", note:"5 км по дну ущелья от входа в парк; билет в парк действует 4 дня — берём его здесь", cost:"¥227"},
]};

const HU_ZJJ_TIANZI = {city:"zjj", title:"Тяньцзышань и Янцзяцзе", sub:"Вторая половина парка: гребни и смотровые над облаками", places:[
  {k:"zhangjiajie", name:"Тяньцзышань", tag:"sight", note:"Смотровые Хэлун и Юби, подъём автобусом парка — билет уже куплен"},
  {k:"zhangjiajie", name:"Янцзяцзе и «Природная стена»", tag:"sight", note:"Тише, чем Юаньцзяцзе: узкие гребни, очередей меньше"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"Шашлычки и лапша у реки", cost:"¥60–90"},
]};

const HU_ZJJ_HUANGSHI = {city:"zjj", title:"Хуаншичжай: последний день билета", sub:"Смотровая над скалами, вид на «Золотой хлыст»", places:[
  {k:"zhangjiajie", name:"Хуаншичжай", tag:"sight", note:"Круговая смотровая на скалы; канатка или 40 минут пешком вверх — последний день билета"},
  {k:"zhangjiajie", name:"Спуск по тропе к «Золотому хлысту»", tag:"sight", note:"Каменный столб в 380 м, тот самый вид с открыток"},
]};

const HU_ZJJ_FREE = {city:"zjj", title:"Чжанцзяцзе без плана", sub:"Город, рынок, сборы перед выездом", places:[
  {k:"zhangjiajie", name:"老院子: усадьба с резьбой", tag:"sight", note:"Час на осмотр, тихо и без групп"},
  {k:"zhangjiajie", name:"Рынок и сувениры", tag:"shopping", note:"Перец, чай, копчёное мясо — домой"},
]};

const HU_ZJJ_OUT = {city:"cq", title:"Чжанцзяцзе → Чунцин", sub:"Поезд, ночь у аэропорта", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе-Запад → Чунцин-Запад", tag:"transport", note:"Около 3 ч 15, брать дневной", cost:"¥180"},
  {k:"chongqing", name:"Отель у аэропорта Цзянбэй", tag:"hotel", note:"Без заезда в город: утром сразу на вылет"},
]};

/* ==================== БЭЙБЭЙ: СПА-ФИНАЛ ==================== */

const HU_ZJJ_TO_BEIBEI = {city:"bb", title:"Чжанцзяцзе → Бэйбэй", sub:"Поезд до Чунцина, метро на север, заселение в спа-отель", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе-Запад → Чунцин-Запад", tag:"transport", note:"Около 3 ч 15, брать утренний; билеты за 14 дней", cost:"¥180"},
  {k:"beibei", name:"Метро до Бэйбэя", tag:"transport", note:"40–50 минут с пересадкой от центра; если отель даёт трансфер — проще"},
  {k:"beibei", name:"Спа-отель с горячими источниками", tag:"hotel", note:"Две ночи в одном месте, номера с собственным бассейном или общим онсэном"},
  {k:"beibei", name:"Вечер в источниках", tag:"spa", note:"После поезда — сразу в воду, ужин в отеле"},
]};

const BB_DEPART = {city:"cq", title:"Бэйбэй → аэропорт Цзянбэй", sub:"Метро до терминала, вылет 10:05", places:[
  {k:"beibei", name:"Метро до аэропорта Цзянбэй", tag:"transport", note:"Около часа с пересадкой — выезжать в 7:00, к регистрации в 8:05"},
  {k:"chongqing", name:"Рейс GS7941 Чунцин → Москва", tag:"transport", note:"Вылет 10:05, прилёт в Шереметьево 13:55 (по пятницам); дома 11.12"},
]};

/* ==================== ВАРИАНТЫ ==================== */


/* финальный вылет в вариантах, которые продолжаются после Гонконга */
const HK_SHOP_END = {city:"hk", title:"Последний день в Гонконге", sub:"Рынки, подарки, вечер на набережной", places:[
  {k:"mong_kok", name:"Causeway Bay + Harbour City", tag:"shopping", note:"Рождественские витрины, подарки домой"},
  {k:"tsim_sha_tsui", name:"Прощальный ужин с видом на гавань", tag:"food", note:"Бронировать за неделю", cost:"HK$600–700"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная Tsim Sha Tsui"},
]};

/* ==================== ГУАНЧЖОУ И ГУЙЛИНЬ ==================== */

const GZ_ARRIVE = {city:"gz", title:"Гонконг → Гуанчжоу", sub:"47 минут скоростным поездом, Кантонская опера, набережная жемчужной реки", places:[
  {k:"guangzhou", name:"Поезд West Kowloon → Guangzhou South", tag:"transport", note:"47 мин, без аэропорта и досмотров; паспорт на границе по пути", cost:"HK$60–90"},
  {k:"guangzhou", name:"Заселение у Пекин-роуд / Тауэр", tag:"hotel", note:"Метро 5–10 мин до всего центра"},
  {k:"canton_opera", name:"Кантонская опера (Заха Хадид)", tag:"sight", note:"Снаружи бесплатно в любой момент, внутрь — на вечерний спектакль", cost:"от ¥100"},
  {k:"canton_tower", name:"Кантон-Тауэр и ночная река", tag:"sight", note:"Смотровая 488 м или прогулка по реке; подсветка после 19:00", cost:"¥150 / ¥80"},
  {k:"guangzhou", name:"Ужин: кантонская кухня", tag:"food", note:"Жареный гусь, димсам и вино у риса", cost:"¥100–150"},
]};

const GZ_DAY = {city:"gz", title:"Гуанчжоу: Шамянь и храм Чэнь", sub:"Колониальная архитектура, сады, самый ранний димсам", places:[
  {k:"shamian", name:"Остров Шамянь", tag:"sight", note:"Бывшая британская и французская концессия: виллы, платаны, кофе — до 11:00 можно на велосипеде"},
  {k:"chen_clan", name:"Храм клана Чэнь (陈家祠)", tag:"sight", note:"Резная керамика и крыши, лучший пример местного зодчества", cost:"¥10"},
  {k:"guangzhou", name:"Димсам-завтрак: Point Point / Bing Sheng", tag:"food", note:"Нужно к 09:00 — у местных это и есть завтрак", cost:"¥60–90 на двоих"},
  {k:"guangzhou", name:"Пекин-роуд и вверху — шоппинг", tag:"shopping", note:"Всё дешевле, чем в Гонконге", cost:""},
]};

const GZ_TO_GL = {city:"gl", title:"Гуанчжоу → Гуйлинь", sub:"Поезд 2 ч 30, река Ли и горы из открытки", places:[
  {k:"guangzhou", name:"Скоростной поезд Guangzhou South → Guilin North", tag:"transport", note:"2 ч 30; утренний — чтобы к обеду быть у воды", cost:"¥150–180"},
  {k:"guilin", name:"Заселение в Гуйлине, набережная Лицзян", tag:"hotel", note:"Ночь в городе, дальше — в Яншо"},
  {k:"li_river", name:"Круиз по реке Ли (Гуйлинь → Яншо)", tag:"sight", note:"4 ч, самые известные виды — со скалы 20 юаней; продаётся на утро следующего дня", cost:"¥230–360"},
  {k:"guilin", name:"Ужин: рыба в пивном соусе", tag:"food", note:"Местная кухня Гуанси", cost:"¥80–120"},
]};

const GL_CRUISE = {city:"gl", title:"Круиз по Ли и Яншо", sub:"Плавно по горам, вечер в деревне", places:[
  {k:"li_river", name:"Круиз Гуйлинь → Яншо", tag:"sight", note:"4 ч по самым красивым участкам, обед на борту", cost:"¥230–360"},
  {k:"yangshuo", name:"Заселение в Яншо", tag:"hotel", note:"Домик у реки, подальше от Западной улицы — тише и красивее"},
  {k:"west_street", name:"Западная улица вечером", tag:"food", note:"Шумно, но один раз стоит", cost:"¥100–150"},
]};

const GL_YANGSHUO = {city:"gl", title:"Яншо: велосипеды и река Юлун", sub:"Карстовые пики, падди, лодка с бамбуковым плотом", places:[
  {k:"yulong_river", name:"Бамбуковый плот по Юлуну", tag:"sight", note:"Утро: вода спокойная, лодочников меньше", cost:"¥120–180"},
  {k:"yangshuo", name:"Велосипедный круг: Moon Hill → падди", tag:"sight", note:"Прокат 30–50 юаней за день, равнина — без высоты"},
  {k:"yangshuo", name:"Спа: массаж и травяные ванны", tag:"spa", note:"После двух дней дороги, у отеля часто дешевле, чем в городе", cost:"¥200–300"},
]};

const GL_LONGSHENG = {city:"gl", title:"Террасы Лунцзи и обратно", sub:"Рисовые террасы в облаке, вечером поезд в Гуйлинь", places:[
  {k:"longsheng", name:"Рисовые террасы Лунцзи", tag:"sight", note:"Перевал 2 ч от Гуйлиня, ЮНЕСКО; в декабре сухо и видно — лучший сезон для террас", cost:"¥80 + транспорт"},
  {k:"longsheng", name:"Массаж в деревне и обед у хозяев", tag:"food", note:"Бамбук с рисом, курица в листьях", cost:"¥60–90"},
  {k:"guilin", name:"Возврат в Гуйлинь, поезд в Гуанчжоу", tag:"transport", note:"Вечерний поезд 2 ч 30 — ночь уже в Гуанчжоу, ближе к аэропорту", cost:"¥150–180"},
]};

const GZ_DEPART = {city:"gz", title:"Вылет домой из Гуанчжоу", sub:"Прогулка утром, аэропорт Байюнь", places:[
  {k:"guangzhou", name:"Утро: последний димсам и подарки", tag:"food", note:"Пекин-роуд рядом с отелем", cost:"¥60–90"},
  {k:"guangzhou", name:"Аэропорт Байюнь", tag:"transport", note:"Метро от центра 45 мин, запас 3 часа"},
  {k:"guangzhou", name:"Рейс Гуанчжоу → Москва", tag:"transport", note:"Прямой, около 10 ч; либо стыковка через Дубай"},
]};

/* ==================== ШАНХАЙ, ХАНЧЖОУ, СУЧЖОУ ==================== */

const SH_ARRIVE = {city:"sh", title:"Гонконг → Шанхай", sub:"Перелёт 2 ч 30, Бунд в сумерках", places:[
  {k:"shanghai", name:"Перелёт Гонконг → Шанхай Пудун", tag:"transport", note:"2 ч 30, рейсов много в течение дня", cost:"¥600–900"},
  {k:"shanghai", name:"Заселение на Бунде / в бывшей французской концессии", tag:"hotel", note:"Пешком до всего исторического центра"},
  {k:"bund", name:"Бунд и Пудун в подсветке", tag:"sight", note:"Подсветку включают к 18:30, бесплатно"},
  {k:"shanghai", name:"Ужин: шанхайские паровые булочки", tag:"food", note:"Сяолунбао в Din Tai Fung или у Jia Jia", cost:"¥90–140"},
]};

const SH_CITY = {city:"sh", title:"Шанхай: концессия, музеи, крыши", sub:"Архитектура и rooftops", places:[
  {k:"former_french", name:"Бывшая французская концессия", tag:"sight", note:"Узкие улицы с платанами, книжные, кофейни — лучший пеший маршрут"},
  {k:"tianzifang", name:"Тяньцзыфан и Xintiandi", tag:"sight", note:"Камянные переулки лун против буржуазной застройки"},
  {k:"shanghai_museum", name:"Шанхайский музей / Power Station of Art", tag:"sight", note:"Музей — бесплатно, PSA — большие выставки в бывшей электростанции", cost:"бесплатно / ¥60"},
  {k:"shanghai", name:"Rooftop-бар с видом на Пудун", tag:"food", note:"Один коктейль дороже ужина, но вид того стоит", cost:"¥120–180"},
]};

const SH_TO_SZ = {city:"sz", title:"Шанхай → Сучжоу → Ханчжоу", sub:"Сады ЮНЕСКО утром, чайные холмы к вечеру", places:[
  {k:"suzhou", name:"Поезд Шанхай → Сучжоу", tag:"transport", note:"25 минут, поезда каждые 15 мин", cost:"¥40"},
  {k:"humble_garden", name:"Сад Скромного чиновника", tag:"sight", note:"Главный сад Китая, ЮНЕСКО; до 10:00 мало людей", cost:"¥70"},
  {k:"suzhou", name:"Каналы Пинцзян-роуд и сад Мастера сетей", tag:"sight", note:"Второй сад — маленький и тихий", cost:"¥40"},
  {k:"hangzhou", name:"Поезд Сучжоу → Ханчжоу", tag:"transport", note:"1 ч 20, ночёвка у Западного озера", cost:"¥110"},
]};

const HZ_DAY = {city:"hz", title:"Ханчжоу: Западное озеро и чай", sub:"Лунцзин, храм, вечер на воде", places:[
  {k:"west_lake", name:"Западное озеро, прогулка вдоль берега", tag:"sight", note:"Бесплатно, но аренда лодки — отдельно", cost:"¥60"},
  {k:"longjing", name:"Чайные холмы Лунцзин", tag:"sight", note:"Дегустация у плантаторов, здесь же продают свежий чай", cost:"¥50–100"},
  {k:"lingyin_temple", name:"Храм Линъинь и скалы Фэйлай", tag:"sight", note:"300 высеченных в скале Будд", cost:"¥45"},
  {k:"hangzhou", name:"Ужин: озерная рыба и шелк", tag:"food", note:"", cost:"¥100–150"},
]};

const HZ_TO_SH = {city:"sh", title:"Ханчжоу → Шанхай", sub:"Поезд 1 час, свободный вечер в городе", places:[
  {k:"hangzhou", name:"Поезд Ханчжоу → Шанхай", tag:"transport", note:"1 час, каждые 20 мин", cost:"¥73"},
  {k:"shanghai", name:"Свободный вечер: книжные и рынки", tag:"sight", note:"Последний шоппинг перед вылетом"},
]};

const SH_DEPART = {city:"sh", title:"Вылет домой", sub:"Аэропорт Пудун, дневной рейс", places:[
  {k:"shanghai", name:"Аэропорт Пудун", tag:"transport", note:"Метро до терминала 45 мин, запас 3 часа"},
  {k:"shanghai", name:"Дневной рейс Шанхай → Москва", tag:"transport", note:"Прямой, около 9 ч"},
]};

/* ==================== ХАЙНАНЬ ==================== */

const SY_ARRIVE = {city:"sy", title:"Гонконг → Санья", sub:"Перелёт 1 ч 45, вечер у моря", places:[
  {k:"sanya", name:"Перелёт Гонконг → Санья", tag:"transport", note:"Hong Kong Airlines / HK Express, около 10 рейсов в неделю", cost:"¥700–1100"},
  {k:"sanya", name:"Заселение: курорт в Ялонг-Бэй или Дадунхае", tag:"hotel", note:"Ялонг-Бэй — самые дорогие и самые тихие отели"},
  {k:"sanya", name:"Первый вечер на пляже", tag:"sight", note:"В декабре +25, море тёплое"},
]};

const SY_SPA_DAY = {city:"sy", title:"Санья: спа и пляж", sub:"Ничего не планируем", places:[
  {k:"sanya", name:"Спа-день в отеле", tag:"spa", note:"Дневной спа-пакет: массаж, ванны, полотенца", cost:"¥400–600"},
  {k:"sanya", name:"Пляж и бассейн", tag:"sight", note:"Шезлонги у отеля бесплатно"},
  {k:"sanya", name:"Ужин: морепродукты у First Market", tag:"food", note:"Выбрать в аквариуме, готовят рядом", cost:"¥150–250"},
]};

const SY_DAYTRIP = {city:"sy", title:"Санья: природа и храм", sub:"Остров Вужичжоу и Наньшань", places:[
  {k:"wuzhizhou", name:"Остров Вужичжоу", tag:"sight", note:"Снорклинг и прозрачная вода, катер 20 мин", cost:"¥144"},
  {k:"nanshan_sanya", name:"Наньшань: статуя Гуаньинь на море", tag:"sight", note:"Гигантская статуя на волне, потрясающий вид", cost:"¥108"},
  {k:"sanya", name:"Спа-ритуал на закате", tag:"spa", note:"После дня в океане это лучший ритуал", cost:"¥300–400"},
]};

const SY_LINEUP = {city:"sy", title:"Санья: прогулки и йога", sub:"Тихий курортный день", places:[
  {k:"sanya", name:"Утренняя йога на пляже", tag:"spa", note:"У большинства отелей бесплатная группа"},
  {k:"sanya", name:"Ботанический сад или тропический парк", tag:"sight", note:"Листья, водопады, орхидеи", cost:"¥100"},
  {k:"sanya", name:"Тайский островок (для тех, кто хочет лодку)", tag:"optional", note:"Пропустить — можно просто пляж", cost:""},
]};

const SY_BUBBLE = {city:"sy", title:"Санья: только отдых", sub:"Пляж и бассейн", places:[
  {k:"sanya", name:"Пляж, бассейн и книга", tag:"sight", note:"Ничего не планируем"},
]};

const SY_DEPART = {city:"sy", title:"Вылет домой", sub:"Аэропорт Санья, около 3 часов", places:[
  {k:"sanyaphx", name:"Перелёт Санья → Гонконг → Москва", tag:"transport", note:"Через Гонконг или Шэньчжэнь"},
]};

/* ==================== ВАРИАНТ 3: ФУЖУН → ГОРЫ → ЧУНЦИН → ГОНКОНГ ==================== */

const FURONG_OUT_ZJJ = {city:"fr", title:"Фужун и Красный каменный лес", sub:"Утро у водопада, геопарк Гучжан, вечером поезд в горы", places:[
  {k:"furong", name:"Водопад Фужуна утром", tag:"sight", note:"До 9:00 почти никого — вся открытка ваша", cost:"¥100"},
  {k:"furong_cave", name:"Красный каменный лес (Гучжан)", tag:"sight", note:"Геопарк с красными скалами, 1 ч от Фужуна", cost:"¥80"},
  {k:"furong", name:"Поезд в Чжанцзяцзе", tag:"transport", note:"Скоростной, 1 ч 30; заселение в Улинъюане", cost:"¥90"},
]};

const ZJJ_20_HUANGSHI = {city:"zjj", title:"Хуаншичжай", sub:"Смотровая над скалами, вид на «Золотой хлыст»", places:[
  {k:"zhangjiajie", name:"Хуаншичжай", tag:"sight", note:"Третий день билета ¥227 — самый спокойный участок парка", cost:"входит в билет"},
  {k:"zhangjiajie", name:"Тропа «Золотой хлыст»", tag:"sight", note:"7,5 км внизу вдоль ручья, можно выйти к лифту"},
]};

const ZJJ_DAY2 = {city:"zjj", title:"Тяньцзышань и Хуаншичжай", sub:"Гребни над облаками и смотровая над «Золотым хлыстом»", places:[
  {k:"zhangjiajie", name:"Тяньцзышань", tag:"sight", note:"Второй день билета ¥227; подъём на автобусе, спуск пешком по желанию", cost:"входит в билет"},
  {k:"zhangjiajie", name:"Хуаншичжай", tag:"sight", note:"Самые плотные скалы парка, 2–3 часа по смотровым"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"", cost:"¥80–120"},
]};

const ZJJ_TMEN_CQ = {city:"cq", title:"Тяньмэньшань и поезд в Чунцин", sub:"Канатка 7,5 км, 999 ступеней, вечером три часа до Чунцина", places:[
  {k:"tianmen", name:"Канатка на Тяньмэньшань", tag:"sight", note:"Самая длинная в мире; приехать к 8:00 — до групп", cost:"¥278"},
  {k:"tianmen", name:"Стеклянная тропа и 999 ступеней", tag:"sight", note:"Иней на ступенях с утра — обувь с протектором"},
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе → Чунцин", tag:"transport", note:"3 ч 15, вечерний; заселение в Цзефанбэе", cost:"¥180"},
  {k:"hongya_cave", name:"Хунъядун в подсветке", tag:"sight", note:"Если приехать до 21:00 — подсветка ещё горит"},
]};

const CQ_TO_HK_FEST = {city:"hk", title:"Чунцин → Гонконг, первый день фестиваля", sub:"Утро на рельсах, дневной перелёт, вечер на Clockenflap", places:[
  {k:"liziba", name:"Лицзыба утром", tag:"sight", note:"Монорельс сквозь дом, 8:30 — почти без людей"},
  {k:"chongqing", name:"Перелёт Чунцин → Гонконг", tag:"transport", note:"2 ч 15, днём; из аэропорта до Джордана 40 мин на A21", cost:"¥700–1000"},
  {k:"yau_ma_tei", name:"Заселение, Jordan / Yau Ma Tei", tag:"hotel", note:"До Central Harbourfront — метро 15 мин"},
  {k:"central_harbourfront", name:"Clockenflap: день 1", tag:"festival", note:"Открытие фестиваля; расписание сцен за месяц на clockenflap.com", cost:"билет"},
]};

const HK_FEST_DAY2 = {city:"hk", title:"Clockenflap: день 2", sub:"Утром Ковлун, вечером сцены", places:[
  {k:"temple_street", name:"Утро: Temple Street и рынки", tag:"sight", note:"До 11:00 спокойно, заодно завтрак в чайной"},
  {k:"avenue_of_stars", name:"Avenue of Stars и Star Ferry", tag:"sight", note:"Паром через гавань — 5 минут и лучший вид", cost:"~HK$5"},
  {k:"central_harbourfront", name:"Clockenflap: день 2", tag:"festival", note:"Полдень — 23:00, сцены на набережной", cost:"билет"},
]};

const HK_LANTAU_SHOP = {city:"hk", title:"Лантау: Будда, Tai O и шоппинг", sub:"Канатка, Большой Будда, свайная деревня, вечером витрины", places:[
  {k:"ngong_ping", name:"Канатка Ngong Ping 360", tag:"transport", note:"Туда-обратно, онлайн дешевле", cost:"HK$295"},
  {k:"tian_tan_buddha", name:"Большой Будда (Tian Tan)", tag:"sight", note:"268 ступеней к статуе"},
  {k:"tai_o", name:"Деревня Tai O", tag:"sight", note:"Свайные дома, морепродукты, лодки"},
  {k:"mong_kok", name:"Causeway Bay + Harbour City вечером", tag:"shopping", note:"Рождественские витрины с 20.11", cost:""},
  {k:"tsim_sha_tsui", name:"Ужин Yardbird / Ho Lee Fook", tag:"food", note:"Бронировать за неделю", cost:"HK$600–700"},
]};

const HK_DEPART_ZJJ = {city:"hk", title:"Вылет домой", sub:"Прямой Аэрофлот SU213 в 11:55, Шереметьево в 17:50", places:[
  {k:"mong_kok", name:"Утро: сборы, чай и подарки у отеля", tag:"shopping", note:"До рынков времени нет: выезд из Джордана к 8:30"},
  {k:"hongkong", name:"Прямой рейс Гонконг → Москва", tag:"transport", note:"SU213, 11:55 → 17:50, 10 ч 55; летает по пн, ср и пт — 11.12 как раз пятница"},
  {k:"hongkong", name:"Дома вечером 11.12", tag:"transport", note:"Отдых 12–13.12, на работу 14.12"},
]};

/* ==================== ВАРИАНТ 3 (основной): ЧУНЦИН → ГОРЫ → ФУЖУН → ГОНКОНГ ==================== */

const V3_CQ_ARRIVE = {city:"cq", title:"Прилёт в Чунцин", sub:"Вылет 26.11 со стыковкой, утро 27.11 в Чунцине", places:[
  {k:"chongqing", name:"Перелёт Москва → Чунцин", tag:"transport", note:"Прямой GS7942 летает только по вторникам и пятницам, поэтому летим 26.11 со стыковкой (Ухань, Пекин, Гуанчжоу или Урумчи), 12–16 ч в пути"},
  {k:"jiefangbei", name:"Отель в Цзефанбэй, отсыпка", tag:"hotel", note:"До набережной и Хунъядуна пешком"},
  {k:"qiansimen_bridge", name:"Хунъядун с моста Цяньсымэнь", tag:"sight", note:"Подсветка до 22:00. С моста ровно, без ступенек, а в кадре весь «дом на скале»"},
  {k:"hongya_cave", name:"Хотпот 珮姐 (Peijie)", tag:"food", note:"К 17:30, пока нет очереди", cost:"¥120–150"},
]};

const V3_CQ_OLD = {city:"cq", title:"Храм архатов, галерея и театр", sub:"Весь центр 渝中 пешком, вечером шоу в Цикоу", places:[
  {k:"luohan_temple", name:"Храм архатов (罗汉寺)", tag:"sight", note:"8:00–17:00, метро 小什字: 524 архата и сунские рельефы на 古佛岩. Вход даёт три палочки и свечу", cost:"¥20"},
  {k:"art_gallery_cq", name:"Chongqing Art Gallery", tag:"sight", note:"10:00–18:00, вход бесплатный; закрыто по понедельникам — поэтому идём в субботу"},
  {k:"jiefangbei", name:"Обед на 八一好吃街", tag:"food", note:"", cost:"¥15–25"},
  {k:"ciqikou", name:"Цикоу", tag:"sight", note:"Бесплатно; к вечеру толпа мягче, до театра пешком"},
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"20:00, 75 минут, зал вращается на 360°; по понедельникам у театра выходной", cost:"¥279"},
]};

const V3_CQ_RAF = {city:"cq", title:"Лицзиба, Куйсинлоу и крыша Raffles City", sub:"Поезд сквозь дом, 22-й этаж на уровне улицы и 250 метров над рекой", places:[
  {k:"liziba", name:"Лицзиба: поезд сквозь дом", tag:"sight", note:"Линия 2, смотровая бесплатная, поезда каждые 5–10 минут"},
  {k:"kuixinglou", name:"Куйсинлоу", tag:"sight", note:"Бесплатно, 8:00–22:00: первый этаж на набережной, а 22-й — на уровне улицы"},
  {k:"raffles_city", name:"Raffles City: обзор 探索舱, 250 м", tag:"sight", note:"10:00–22:00, последние билеты в 21:00; приходить к 17:00 — закат в 17:50 и ночные огни", cost:"¥120"},
  {k:"raffles_city", name:"云中漫步: прогулка по крыше", tag:"sight", note:"Скайуок по гребню水晶连廊, по слотам; закрывают при ветре и дожде — бронировать заранее", cost:"~¥160"},
  {k:"jiefangbei", name:"Ужин с видом на реку", tag:"food", note:"", cost:"¥100–150"},
]};
const MAIN_CQ_RAF = {city:"cq", title:"Лицзиба, Raffles City и хотпот с видом на реку", sub:"Поезд сквозь дом, крыша 250 м, вечером терраса над Янцзы", places:[
  {k:"liziba", name:"Лицзиба: поезд сквозь дом", tag:"sight", note:"Линия 2, смотровая бесплатная, поезда каждые 5–10 минут"},
  {k:"kuixinglou", name:"Куйсинлоу", tag:"sight", note:"Бесплатно, 8:00–22:00: первый этаж на набережной, а 22-й — на уровне улицы"},
  {k:"raffles_city", name:"Raffles City: обзор 探索舱, 250 м", tag:"sight", note:"10:00–22:00, последние билеты в 21:00; идём днём, к 12:30 — закат встречаем уже на южном берегу", cost:"¥120"},
  {k:"raffles_city", name:"云中漫步: прогулка по крыше", tag:"sight", note:"Скайуок по гребню 水晶连廊, по слотам; закрывают при ветре и дожде — бронировать заранее", cost:"~¥160"},
  {k:"nanbinlu", name:"Рекомендация: хотпот 红九格·江景花园 (Hongjiuge)", tag:"food", note:"Рекомендация, не обязательный пункт — заведения разберём отдельно: Наньбиньлу, южный берег, терраса на крыше с видом на реку, Raffles City и подсветку противоположного берега. Около ¥80 с человека; столик на террасе бронировать заранее", cost:"¥80"},
]};


const V3_CQ_WULONG = {city:"cq", title:"Улун: Три моста и ущелье", sub:"Поезд 35–50 минут, оба объекта за день, вечером обратно в Чунцин", places:[
  {k:"wulong", name:"Поезд Чунцин-Восточный → Улун-Южный, около 7:00", tag:"transport", note:"Скоростной 35–50 минут, ¥76; билеты за 14 дней на 12306 или Trip.com, обратный брать сразу. От станции до парка ещё 40 минут автобусом или такси — это и есть весь запас дня"},
  {k:"three_natural_bridges", name:"Тяньшэн саньцяо (Три моста)", tag:"sight", note:"Три природных моста в карстовой воронке, 2–3 часа; спуск по ступеням и лифт наверх, утром меньше групп. Снимали «Трансформеры» и «Проклятие золотого цветка», а не «Аватар»", cost:"¥125"},
  {k:"longshuixia", name:"Ущелье Луншуйся", tag:"sight", note:"10 минут от Трёх мостов, тропа по дну ущелья с водопадами, 1,5–2 часа; межсезонный тариф, в декабре бывает скользко — микрошипы не помешают", cost:"¥85"},
  {k:"chongqing", name:"Возврат в Чунцин", tag:"transport", note:"Вечерний поезд, в городе к 19:00–20:00; ужин у отеля в Цзефанбэе"},
]};

const V3_TO_ZJJ = {city:"zjj", title:"Чунцин → Чжанцзяцзе", sub:"Поезд 2 ч 29, днём Цзиньбяньси", places:[
  {k:"chongqing", name:"Поезд Чунцин-Восточный → Чжанцзяцзе-Западный", tag:"transport", note:"07:12 → 09:41 или ближе к 9 утра; больше 20 рейсов в день", cost:"¥197–273"},
  {k:"zhangjiajie", name:"Заселение в Улинъюане", tag:"hotel", note:"У Восточных ворот — ближе к лифту Байлун, Тяньцзышаню и Шили Хуалан"},
  {k:"zhangjiajie", name:"Тропа Цзиньбяньси", tag:"sight", note:"7,5 км по ровной долине у ручья — самая лёгкая тропа парка"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"", cost:"¥80–120"},
]};

const V3_ZJJ_AVATAR = {city:"zjj", title:"Юаньцзяцзе: парк «Аватар»", sub:"Лифт Байлун, мост Первого кадра, Мицунтай", places:[
  {k:"zhangjiajie", name:"Лифт Байлун", tag:"sight", note:"Подъём на плато за минуту; очередь с 9:00 — приходить к открытию", cost:"¥65"},
  {k:"zhangjiajie", name:"Мост Первого кадра и Мицунтай", tag:"sight", note:"Те самые горы из «Аватара», смотровые на гребне"},
  {k:"zhangjiajie", name:"Пропуск в парк", tag:"sight", note:"С 01.12 низкий сезон: ¥147 вместо ¥224–228, действует 4 дня с многократным входом", cost:"¥147"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"", cost:"¥80–120"},
]};

const V3_ZJJ_TIANZI = {city:"zjj", title:"Тяньцзышань", sub:"«Море пиков», Пик императорской кисти и «Фея, разбрасывающая цветы»", places:[
  {k:"zhangjiajie", name:"Тяньцзышань", tag:"sight", note:"Автобус до вершины, вниз канаткой; панорамы «моря пиков» — лучшие в парке", cost:"¥72"},
  {k:"zhangjiajie", name:"Смотровые «Пик императорской кисти» и «Фея»", tag:"sight", note:"Утром иней на ступенях — микрошипы из лавки у входа решают"},
  {k:"zhangjiajie", name:"Комбо 3 канатки + лифт Байлун", tag:"sight", note:"Выгоднее, чем брать по одному", cost:"¥193"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"", cost:"¥80–120"},
]};

const V3_FURONG = {city:"fr", title:"Чжанцзяцзе → Фужун", sub:"23 минуты поездом, водопад и вечерняя подсветка", places:[
  {k:"furong", name:"Поезд Чжанцзяцзе-Западный → Фужунчжэнь", tag:"transport", note:"23 минуты, 12 поездов в день", cost:"¥40"},
  {k:"furong", name:"«Городок на водопаде»", tag:"sight", note:"Водопад падает прямо в реку посреди старого города; ночуем с видом на воду", cost:"¥100"},
  {k:"furong", name:"Вечерняя подсветка", tag:"sight", note:"Главное время — после 18:00: свет, вода и почти пустой город"},
  {k:"furong", name:"Ужин: туцзяская кухня", tag:"food", note:"", cost:"¥60–90"},
]};

const V3_FURONG_HK = {city:"hk", title:"Фужун → Гонконг", sub:"Утро в городке, единственный прямой поезд в 15:39", places:[
  {k:"furong", name:"Утро в старом городе", tag:"sight", note:"До групп: улица, водопад сверху, чай на террасе"},
  {k:"furong", name:"G6079: Фужунчжэнь → Гонконг (Коулун)", tag:"transport", note:"15:39 → 21:51, 6 ч 16, единственный поезд в день — билеты за 14 дней", cost:"¥770"},
  {k:"west_kowloon", name:"Прибытие в Западный Коулун", tag:"transport", note:"Паспортный контроль на месте, до Джордана 10 минут на метро"},
  {k:"yau_ma_tei", name:"Заселение в Джордане", tag:"hotel", note:"Поздний ужин на Temple Street", cost:"HK$80"},
]};

const V3_HK_FEST = {city:"hk", title:"Clockenflap: весь день", sub:"Воскресенье 6.12 — закрытие фестиваля. Дата зафиксирована", places:[
  {k:"central_harbourfront", name:"Clockenflap, день 3", tag:"festival", note:"Сцены с полудня до 23:00, Central Harbourfront; расписание за месяц на clockenflap.com", cost:"однодневный билет"},
  {k:"central_hk", name:"Обед в Централе до открытия", tag:"food", note:"", cost:"HK$80"},
  {k:"victoria_harbour", name:"Обратно через Star Ferry", tag:"transport", note:"Последний паром около 23:00 — проверить в день фестиваля", cost:"HK$5"},
]};

const V3_HK_CENTRAL = {city:"hk", title:"Централ и Пик", sub:"Эскалатор, арт-кварталы, храм, вершина", places:[
  {k:"central_hk", name:"Central Mid-Levels и PMQ", tag:"sight", note:"Утро без спешки, кофе в Lan Fong Yuen", cost:"HK$40"},
  {k:"central_hk", name:"Tai Kwun и Man Mo Temple", tag:"sight", note:"Арт-центр в бывшей тюрьме, вход бесплатный"},
  {k:"victoria_peak", name:"Трамвай на Пик", tag:"sight", note:"Онлайн дешевле; лучше к 16:30 — закат и сумерки", cost:"HK$116"},
  {k:"victoria_harbour", name:"Ужин в Централе", tag:"food", note:"", cost:"HK$150–250"},
]};

const V3_HK_KOWLOON = {city:"hk", title:"Ковлун: M+ и набережная", sub:"Музеи, Avenue of Stars, вечерний свет", places:[
  {k:"tsim_sha_tsui", name:"Музей M+", tag:"sight", note:"Вторник — открыт (по понедельникам закрыт), таймслот онлайн", cost:"HK$190"},
  {k:"tsim_sha_tsui", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно"},
  {k:"avenue_of_stars", name:"Avenue of Stars и Star Ferry", tag:"sight", note:"", cost:"HK$5"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная гавани"},
  {k:"mong_kok", name:"Вечером Causeway Bay и Harbour City", tag:"shopping", note:"Витрины с 20.11"},
]};

const V3_HK_DISNEY = {city:"hk", title:"Диснейленд", sub:"Среда — низкий тариф и короткие очереди", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор; будний день дешевле", cost:"HK$639"},
  {k:"mong_kok", name:"Прощальный ужин Yardbird / Ho Lee Fook", tag:"food", note:"Бронировать за неделю", cost:"HK$600–700"},
]};

const V3_HK_LANTAU = {city:"hk", title:"Лантау и шоппинг", sub:"Большой Будда, Tai O, рождественские витрины", places:[
  {k:"ngong_ping", name:"Канатка Ngong Ping 360", tag:"sight", note:"Онлайн дешевле; стандартная кабинка туда-обратно", cost:"HK$295"},
  {k:"tian_tan_buddha", name:"Большой Будда и деревня Tai O", tag:"sight", note:"Свайная деревня на воде, лодки между домами"},
  {k:"mong_kok", name:"Вечером Causeway Bay и Harbour City", tag:"shopping", note:"Докупить подарки"},
  {k:"mong_kok", name:"Ужин с видом на гавань", tag:"food", note:"", cost:"HK$300–500"},
]};

const V3_HK_DEPART = {city:"hk", title:"Вылет домой", sub:"SU213 в 11:55, Шереметьево в 17:50", places:[
  {k:"hongkong", name:"Выезд из отеля к 8:30", tag:"transport", note:"До аэропорта на A21 или такси, 40 минут"},
  {k:"hongkong", name:"Прямой Аэрофлот SU213", tag:"transport", note:"11:55 → 17:50, 10 ч 55; летает по пн, ср и пт — 11.12 как раз пятница"},
  {k:"hongkong", name:"Дома вечером 11.12", tag:"transport", note:"Отдых 12–13.12, на работу 14.12"},
]};

/* ==================== ВАРИАНТ 7: ГОНКОНГ → ФУЖУН → ГОРЫ → ЧУНЦИН ==================== */

const HKF_ARRIVE = {city:"hk", title:"Прилёт в Гонконг", sub:"Вылет 1.12 вечером, 2.12 около 10:00 на месте", places:[
  {k:"hongkong", name:"SU212: Москва → Гонконг", tag:"transport", note:"Аэрофлот летает по вторникам, четвергам и воскресеньям: 1.12 (вторник) вылет около 19:05, посадка 2.12 около 10:05 — приезжаем утром, день ещё целый"},
  {k:"yau_ma_tei", name:"Заселение в Джордане", tag:"hotel", note:"A21 от аэропорта 40 минут; до Central Harbourfront — метро 15 минут"},
  {k:"temple_street", name:"Temple Street и первый ужин", tag:"food", note:"Рынок и уличная еда; после ночного перелёта это ровно тот темп, который нужен", cost:"HK$80–120"},
]};

const HKF_DISNEY = {city:"hk", title:"Диснейленд", sub:"Пятница — будний тариф и очереди короче", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор; будний день дешевле и тише — приходить к открытию", cost:"HK$639"},
  {k:"mong_kok", name:"Вечером Causeway Bay: витрины", tag:"shopping", note:"Рождественские витрины с 20.11, к вечеру подсветка"},
  {k:"tsim_sha_tsui", name:"Ужин в Ковлуне", tag:"food", note:"После парка — что-то простое рядом с отелем", cost:"HK$150–250"},
]};

const HKF_KOWLOON = {city:"hk", title:"Ковлун: M+ и набережная", sub:"Музеи, Avenue of Stars, вечерний свет", places:[
  {k:"tsim_sha_tsui", name:"Музей M+", tag:"sight", note:"10:00–18:00, суббота рабочий день, таймслот онлайн", cost:"HK$190"},
  {k:"tsim_sha_tsui", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно, рядом с M+"},
  {k:"avenue_of_stars", name:"Avenue of Stars и Star Ferry", tag:"sight", note:"Пешком по набережной, потом паромом через гавань", cost:"HK$5"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная гавани — самая полная версия шоу"},
]};

const HKF_TO_FURONG = {city:"fr", title:"Гонконг → Фужун", sub:"G6080 в 08:07, в Фужуне около 14:15", places:[
  {k:"west_kowloon", name:"G6080: Западный Коулун → Фужунчжэнь", tag:"transport", note:"08:07 → около 14:15, 6 часов; единственный поезд в этом направлении — билеты за 14 дней", cost:"¥770"},
  {k:"furong", name:"«Городок на водопаде» днём", tag:"sight", note:"Сначала мостки под водопадом, потом чай на террасе; гостевой дом с видом на воду", cost:"¥100"},
  {k:"furong", name:"Вечерняя подсветка", tag:"sight", note:"Главное время после 18:00: свет, вода и почти пустой город"},
  {k:"furong", name:"Ужин: туцзяская кухня", tag:"food", note:"", cost:"¥60–90"},
]};

const FR_TO_ZJJ_MORNING = {city:"zjj", title:"Фужун → Чжанцзяцзе", sub:"23 минуты поездом, заселение в Улинъюане", places:[
  {k:"furong", name:"Утро у водопада, до групп", tag:"sight", note:"До 9:00 на мостках почти никого"},
  {k:"furong", name:"Поезд Фужунчжэнь → Чжанцзяцзе-Западный", tag:"transport", note:"23–30 минут, больше 12 поездов в день; от станции до Улинъюаня ещё 40 минут на автобусе или Didi", cost:"¥40"},
  {k:"zhangjiajie", name:"Заселение у восточных ворот", tag:"hotel", note:"Ближе к лифту Байлун, Тяньцзышаню и Золотому хлысту"},
  {k:"zhangjiajie", name:"Ручей Цзиньбяньси", tag:"sight", note:"7,5 км по ровной долине у ручья — самая лёгкая тропа парка. Билет берём здесь: 4 дня и многократный вход", cost:"¥147"},
]};

const ZJJ_TO_CQ_TRAIN = {city:"cq", title:"Чжанцзяцзе → Чунцин", sub:"Поезд после обеда, вечером Хунъядун", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе-Западный → Чунцин-Восточный", tag:"transport", note:"2 ч 30 – 3 ч 15, больше 20 рейсов в день; выезжать после обеда, чтобы не терять утро в горах", cost:"¥197–273"},
  {k:"jiefangbei", name:"Заселение в Цзефанбэе", tag:"hotel", note:"До набережной и метро пешком"},
  {k:"hongya_cave", name:"Хунъядун с моста Цяньсымэнь", tag:"sight", note:"Подсветка до 22:00; с моста ровно, без ступенек"},
  {k:"jiefangbei", name:"Хотпот 珮姐 (Peijie)", tag:"food", note:"После заселения, к 18:30", cost:"¥120–150"},
]};

const CQ_OLD_SUNDAY = {city:"cq", title:"Храм архатов, галерея и театр", sub:"Воскресенье: центр 渝中 пешком, вечером шоу", places:[
  {k:"luohan_temple", name:"Храм архатов (罗汉寺)", tag:"sight", note:"8:00–17:00, метро 小什字: 524 архата и сунские рельефы на 古佛岩. Вход даёт три палочки и свечу", cost:"¥20"},
  {k:"art_gallery_cq", name:"Chongqing Art Gallery", tag:"sight", note:"10:00–18:00, бесплатно; закрыто по понедельникам — воскресенье рабочий день"},
  {k:"jiefangbei", name:"Обед на 八一好吃街", tag:"food", note:"", cost:"¥15–25"},
  {k:"ciqikou", name:"Цикоу", tag:"sight", note:"Бесплатно; к вечеру толпа мягче, до театра пешком"},
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"20:00, 75 минут, зал вращается на 360°; выходной у театра в понедельник, в воскресенье играют", cost:"¥279"},
]};

const CQ_DEPART_GS7941 = {city:"cq", title:"Вылет домой из Чунцина", sub:"Прямой GS7941 около 10:05, Шереметьево днём", places:[
  {k:"hongya_cave", name:"Выезд из отеля к 7:00", tag:"transport", note:"До Цзянбэя 30 минут на метро линии 10; утренней прогулки нет — вылет ранний"},
  {k:"chongqing", name:"GS7941: Чунцин → Москва", tag:"transport", note:"Вторник и пятница, около 10:05 → 13:55, 8 ч 50; время сверять при покупке", cost:""},
  {k:"chongqing", name:"Дома вечером 15.12", tag:"transport", note:"Отдых 16–17.12, на работу 18.12"},
]};

/* ==================== ВАРИАНТ 2: БИЛЕТЫ CHINA EASTERN, 27.11 → 10.12 ==================== */

/* вылет 27.11 16:45 SVO → 06:55 28.11 PVG, стыковка 2 ч 35, 09:30 → 12:40 CKG */
const V2_FLIGHT = {city:"air", title:"Вылет из Москвы", sub:"16:45 из Шереметьева, ночь в самолёте, утром Шанхай", places:[
  {k:"chongqing", name:"Шереметьево → Шанхай: 16:45, China Eastern", tag:"transport", note:"9 ч 10 в воздухе, посадка в Пудуне в 06:55. Билет один: багаж регистрируют сразу до Чунцина, в Шанхае его не получают"},
]};

const V2_CQ_ARRIVE = {city:"cq", title:"Прилёт в Чунцин", sub:"Пересадка в Шанхае, 12:40 в Цзянбэе, вечером Хунъядун", places:[
  {k:"shanghai", name:"Шанхай: пересадка 06:55 → 09:30", tag:"transport", note:"2 ч 35 в том же терминале Пудуна — без запаса на прогулку, но с багажом за спиной"},
  {k:"chongqing", name:"Прилёт в Цзянбэй, 12:40", tag:"transport", note:"Метро линии 10 до Цзефанбэя — около 40 минут с пересадкой"},
  {k:"jiefangbei", name:"Заселение, Цзефанбэй", tag:"hotel", note:"Отель в центре, пешком до набережной; после 15 часов в пути это отсыпка, а не прогулка"},
  {k:"hongya_cave", name:"Хотпот 珮姐 (Peijie)", tag:"food", note:"К 18:00, пока нет очереди", cost:"¥120–150"},
  {k:"qiansimen_bridge", name:"Хунъядун с моста Цяньсымэнь", tag:"sight", note:"Подсветка до 22:00, с моста ровно, без ступенек. По субботам около 20:30 над реками бывает дрон-шоу — расписание смотреть накануне"},
]};

/* Дисней во вторник 8.12: будний тариф, очередей меньше */
const V2_HK_DISNEY = {city:"hk", title:"Диснейленд", sub:"Вторник — будний тариф и очереди короче", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор; будний день дешевле и тише — приходить к открытию", cost:"HK$639"},
  {k:"mong_kok", name:"Causeway Bay вечером: витрины", tag:"shopping", note:"Рождественская подсветка с 20.11"},
  {k:"tsim_sha_tsui", name:"Ужин в Ковлуне", tag:"food", note:"Что-то простое рядом с отелем — день длинный", cost:"HK$150–250"},
]};

/* последний день: музеи у Западного Коулуна (до станции пешком) и вечером поезд в Футянь */
const V2_KOWLOON_OUT = {city:"shenzhen", title:"Ковлун, M+ и переезд в Шэньчжэнь", sub:"Музеи в двух шагах от вокзала, вечером поезд в Футянь", places:[
  {k:"tsim_sha_tsui", name:"Музей M+", tag:"sight", note:"10:00–18:00, по понедельникам закрыт; камеры хранения на входе — чемоданы оставляем здесь", cost:"HK$190"},
  {k:"tsim_sha_tsui", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно, в соседнем здании; вид с набережной на остров"},
  {k:"west_kowloon", name:"Поезд Западный Коулун → Футянь", tag:"transport", note:"12–14 минут, поезда до 22:00, паспортный контроль на станции. Это второй въезд в материковый Китай — виза не нужна (безвиз РФ–КНР), но контроль проходим снова", cost:"¥75"},
  {k:"futian", name:"Футянь → аэропорт Баоань", tag:"transport", note:"Метро линия 11 до станции 机场, 35–40 минут"},
  {k:"sz_airport", name:"Отель у аэропорта", tag:"hotel", note:"Ночь в 10 минутах от терминала: подъём в 4:30, а не в 3:00 через границу"},
]};

/* 07:20 SZX → 10:25 PKX, стыковка 1 ч 30, Пекин → Москва, всего 13 ч 10 */
const V2_SZ_DEPART = {city:"shenzhen", title:"Вылет домой из Шэньчжэня", sub:"07:20, стыковка в Пекине, Шереметьево днём", places:[
  {k:"sz_airport", name:"Аэропорт Баоань: быть в 5:20", tag:"transport", note:"От отеля 10 минут; стойки на стыковочный рейс закрываются за час до вылета"},
  {k:"sz_airport", name:"07:20 → 10:25, Пекин Дасин", tag:"transport", note:"3 ч 5; стыковка 1 ч 30 в одном терминале — билет один, багаж до Москвы, при опоздании авиакомпания пересаживает сама"},
  {k:"sz_airport", name:"Пекин → Москва, посадка около 15:30", tag:"transport", note:"Всего 13 ч 10 в пути, дома вечером 10.12; отдых 11–12.12, на работу 13.12. Время посадки сверить при покупке"},
]};

/* ==================== ОСНОВНОЙ ВАРИАНТ: БИЛЕТЫ CZ, 4.12 → 18.12 ==================== */

const MAIN_FLIGHT_OUT = {city:"air", title:"Вылет из Москвы", sub:"Поезд 091*СА в 00:26 4.12, в Москве в 8:23, полдня на работе, 16:45 из Шереметьева", places:[
  {k:"hongkong", name:"Поезд 091*СА: Придача 00:26 → Москва Казанская 08:23", tag:"transport", note:"Билеты куплены, 4 432 ₽ за двоих. Вагон 16, плацкарт, место 43 (нижнее); отправление 4.12 в 00:26 с Придачи (Воронеж Южный), а не с Воронежа-1 — выезжать из дома на ночь раньше. В Москве в 8:23, на работу к 10:00. Тяжёлые вещи оставить дома — возвращаемся 19.12", cost:"4 432 ₽ за двоих"},
  {k:"hongkong", name:"Работа до 12:00, выезд в Шереметьево к 13:30", tag:"transport", note:"Аэроэкспресс около 50 минут; в терминале C быть к 14:00 — регистрация на международный рейс закрывается за час до вылета"},
  {k:"shanghai", name:"MU 248: 16:45 SVO → 6:55 Шанхай (Пудун)", tag:"transport", note:"9 ч 10 в пути, China Eastern, Airbus A330-300, терминал C → терминал 1; ночь в самолёте, 5.12 пересадка 2 ч 05 на тот же Шэньчжэнь"},
]};

const MAIN_HK_ARRIVE = {city:"hk", title:"Прилёт через Шэньчжэнь", sub:"11:40 в Шэньчжэне, метро и поезд через границу, отель в Джордане к 15:00", places:[
  {k:"sz_airport", name:"Пересадка в Пудуне 2 ч 05", tag:"transport", note:"Терминал 1 → терминал 1 без выхода; багаж зарегистрирован до Шэньчжэня, на пересадке получать не надо"},
  {k:"sz_airport", name:"MU 5331: 9:00 Пудун → 11:40 Шэньчжэнь", tag:"transport", note:"2 ч 40, Airbus A330-200. В аэропорту Шэньчжэня метро линия 11 до Футяня — 40 минут, ¥10"},
  {k:"futian", name:"Футянь → Западный Коулун поездом", tag:"transport", note:"14–18 минут, ¥68–75, поезда с 06:35 до 22:31; паспортный контроль в самом вокзале — это первый въезд в материковый Китай, виза не нужна (безвиз РФ–КНР)"},
  {k:"yau_ma_tei", name:"Заселение в Джордане к 15:00", tag:"hotel", note:"До Central Harbourfront — метро 15 минут; в дни фестиваля отели дороже, бронировать заранее"},
  {k:"temple_street", name:"Temple Street и первый ужин", tag:"food", note:"После ночи в самолёте и двух пересадок это ровно тот темп, который нужен: рынок и глиняный горшок с рисом в Hing Kee", cost:"HK$80–120"},
]};

const MAIN_CQ_OLD = {city:"cq", title:"Храм архатов, галерея и театр", sub:"Центр 渝中 пешком, вечером шоу «1949»", places:[
  {k:"luohan_temple", name:"Храм архатов (罗汉寺)", tag:"sight", note:"8:00–17:00, метро 小什字: 524 архата и сунские рельефы на 古佛岩. Вход даёт три палочки и свечу", cost:"¥20"},
  {k:"art_gallery_cq", name:"Chongqing Art Gallery", tag:"sight", note:"10:00–18:00, вход бесплатный; закрыто по понедельникам — сегодня вторник, работает"},
  {k:"jiefangbei", name:"Обед на 八一好吃街", tag:"food", note:"", cost:"¥15–25"},
  {k:"ciqikou", name:"Цикоу", tag:"sight", note:"Бесплатно; к вечеру толпа мягче, до театра пешком"},
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"20:00, 75 минут, зал вращается на 360°; выходной у театра по понедельникам", cost:"¥279"},
]};

const MAIN_CQ_ARRIVE_JB = {city:"cq", title:"Чжанцзяцзе → Чунцин: Цзянбэй", sub:"Поезд после обеда, база в Цисингане или на 时代天街, вечером Хунъядун с того берега", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе-Западный → Чунцин-Восточный", tag:"transport", note:"2 ч 30 – 3 ч 15, больше 20 рейсов в день; выезжать после обеда, чтобы не терять утро в горах", cost:"¥197–273"},
  {k:"jiefangbei", name:"Отель: Цисинган (七星岗) или 龙湖时代天街 (Дапин)", tag:"hotel", note:"Две базы на выбор. Цисинган — линия 1, до Цзефанбэя 10–15 минут пешком, рядом 较场口 и 十八梯; отели 汉庭, SFEEL设计师酒店, Wells — порядка ¥250–400 за ночь. Дапин (龙湖时代天街) — огромный молл с едой на любой вкус и пересадка линий 1 и 2, новые отели дешевле, но до набережной 25–30 минут на метро"},
  {k:"jiangbeizui", name:"Парк Цзянтань (江北嘴江滩公园)", tag:"sight", note:"Линия 6 до 大剧院, выход 2, дальше 800 м пешком вдоль реки. Хунъядун виден целиком с другого берега Цзялина — ровно, без ступенек, а не с моста Цяньсымэнь, где толпа и перила. Подсветка с 18:00 до 23:00; дрон-шоу бывает по выходным — расписание смотреть накануне. В сухой сезон у воды обнажается песчаная отмель, можно спуститься почти к реке. Ветер с воды холодный — шапка не лишняя"},
  {k:"jiangbeizui", name:"Рекомендация: ужин в Цзянбэе, не в 渝中", tag:"food", note:"Рекомендация, не обязательный пункт: хотпот в 渝中 не берём. У 大剧院, в 五里店 — 十八梯眼镜面 (с 1988 года, лапша и вонтоны, ~¥30 с человека). Совсем по-местному — квартал 野水沟 за 观音桥: рынок и забегаловки, где обедают за ¥10–20, но это другой конец Цзянбэя", cost:"¥10–30"},
]};

const MAIN_CQ_NANAN = {city:"cq", title:"Наньань: Сяхаоли, Хуанцзюэя и Лаоцзюньдун", sub:"Южный берег и гора Наньшань, вечером чайная над рекой", places:[
  {k:"kuixinglou", name:"Куйсинлоу", tag:"sight", note:"Бесплатно, 8:00–22:00: первый этаж на набережной Цзялин, а 22-й — на уровне улицы, поднимаешься лифтом. Двадцать минут по пути к метро"},
  {k:"raffles_city", name:"Raffles City: обзор 探索舱, 250 м", tag:"sight", note:"10:00–22:00, последние билеты в 21:00; идём к открытию — в 10:00 очередей нет. Скайуок 云中漫步 по гребню 水晶连廊 — отдельный билет, и при ветре его закрывают", cost:"¥120"},
  {k:"nanbinlu", name:"Линия 6 под Янцзы и Сяхаоли (下浩里)", tag:"sight", note:"От 小什字 до 上新街 — две остановки под рекой, дальше 10 минут пешком вверх. Старый квартал террасами над водой: каменные переулки, книжные, чайные, вид на 东水门 мост. Обед — в маленьких семейных местах квартала, смотреть, где сидят местные, а не где витрина"},
  {k:"huangjueya", name:"Хуанцзюэя (黄桷垭老街)", tag:"sight", note:"Бесплатно, открыто круглосуточно. От 上新街 автобус 346 до 黄桷垭 или 10 минут на Didi вверх по горе. Каменная улица на склоне, дом-музей писательницы Саньмао, начало тропы 黄葛古道 с огромными хуанге. Вниз по ступеням не спускаться — обратно тем же такси"},
  {k:"huangjueya", name:"Лаоцзюньдун (老君洞)", tag:"sight", note:"Даосский храм на склоне Наньшаня: 8:00–17:00, вход до 16:30, бесплатно, на входе дают три палочки благовоний. С верхней площадки 玉皇顶 — панорама всего полуострова 渝中. Заходить лучше с западных ворот 西门: сразу 三清殿, а не лестница ради лестницы; подъём в гору, в декабре с утра влажно — идти не спеша", cost:""},
  {k:"nanbinlu", name:"Рекомендация: чайная 熹玥盒子 (Xiyue Hezi) в Сяхао", tag:"food", note:"Рекомендация, не обязательный пункт — заведения разберём отдельно: старый квартал Сяхао на южном берегу. Дяньча — взбитый сунский чай, десерт-бабочка, тот самый стол; зал маленький, один общий стол и лимит времени, хватает 1–1,5 часа. Скорее про картинку, чем про чай — порции небольшие, ценник выше среднего"},
  {k:"nanbinlu", name:"Рекомендация: ужин 罗地摊 (涂山路)", tag:"food", note:"Рекомендация, не обязательный пункт: семейная закусочная на 涂山路 583 в 弹子石, 10 минут на Didi от 下浩 вдоль берега. 盐煎肉, 肝腰合炒, порции огромные — в отзывах три блюда на троих уносят с собой; работает 11:00–14:30 и 17:00–20:00. Если всё-таки хочется хотпот — он остаётся на южном берегу, 红九格 с террасой на 南滨路, но это уже не «местные тёти»"},
]};

const MAIN_CQ_TO_SH = {city:"sh", title:"Чунцин → Шанхай, ночь у аэропорта", sub:"13:15 из Цзянбэя, 15:45 Пудун, отель у терминала", places:[
  {k:"chongqing", name:"Выезд из отеля к 10:00", tag:"transport", note:"До Цзянбэя 30–40 минут такси; утром только завтрак и сборы — город в этот день уже не смотрим"},
  {k:"chongqing", name:"MU 5430: 13:15 CKG → 15:45 Пудун", tag:"transport", note:"2 ч 30, China Eastern, Airbus A321, терминал 3 → терминал 1; билет один с обратным плечом, багаж зарегистрирован до Шереметьева"},
  {k:"shanghai", name:"Отель у Пудуна, стыковка 20 ч 05", tag:"hotel", note:"Ночлег рядом с терминалом 1, 3–4 тыс. ₽ за номер; на ночь берём ручную кладь и смену белья, чемодан летит транзитом", cost:"~3 500 ₽"},
]};

const MAIN_SH_HOME = {city:"sh", title:"Шанхай → Москва", sub:"11:50 из Пудуна, Шереметьево в 17:05, поезд 126 в 00:46, дома 20.12 днём", places:[
  {k:"shanghai", name:"MU 591: 11:50 Пудун → 17:05 Шереметьево", tag:"transport", note:"10 ч 15, Airbus A330-300, терминал 1 → терминал C; в аэропорту быть к 9:30, из отеля выезжать в 8:45"},
  {k:"hongkong", name:"Аэроэкспресс до Белорусского, дальше на Казанский", tag:"transport", note:"Аэроэкспресс около 50 минут после посадки в 17:05, с Белорусского на Казанский — одна ветка кольцевой, 10 минут. До поезда почти 6 часов: успеваем поужинать, а не ночевать в Москве"},
  {k:"hongkong", name:"Поезд 126: Казанский 00:46 → Придача 11:13", tag:"transport", note:"Билеты куплены, 4 673,80 ₽ за двоих. Вагон 12, плацкарт, место 15 (нижнее); отправление 20.12 в 00:46 — то есть уезжаем из Москвы ночью сразу после прилёта, 10 ч 27 в пути. Дома 20.12 в 11:13: воскресенье на отдых, на работу в понедельник 21.12", cost:"4 673,80 ₽ за двоих"},
]};

const VARIANTS = [
  {
    id:"hk-first", title:"Гонконг → Фужун → Чжанцзяцзе → Чунцин", photo:"Hong Kong", main:true,
    dates:["04.12 · пт","05.12 · сб","06.12 · вс","07.12 · пн","08.12 · вт","09.12 · ср","10.12 · чт",
           "11.12 · пт","12.12 · сб","13.12 · вс","14.12 · пн","15.12 · вт","16.12 · ср","17.12 · чт",
           "18.12 · пт","19.12 · сб"],
    china:[MAIN_FLIGHT_OUT, MAIN_HK_ARRIVE, V3_HK_FEST, V3_HK_CENTRAL, V3_HK_KOWLOON, V3_HK_DISNEY,
           HKF_TO_FURONG, FR_TO_ZJJ_MORNING, V3_ZJJ_AVATAR, V3_ZJJ_TIANZI, MAIN_CQ_ARRIVE_JB,
           MAIN_CQ_OLD, V3_CQ_WULONG, MAIN_CQ_NANAN, MAIN_CQ_TO_SH, MAIN_SH_HOME],
    hk:[],
    cities:["в пути 1 ночь","Шэньчжэнь → Гонконг 5 ночей","Фужун 1","Чжанцзяцзе 3","Чунцин 4","Шанхай 1"],
    summary:"Основной маршрут по купленным билетам, 4–19.12.2026, 14 ночей на месте плюс ночь в самолёте: 4.12 в 16:45 из Шереметьева MU248 через Шанхай (ночь в пути), 5.12 в 11:40 Шэньчжэнь, метро и поезд через границу — в Джордане к 15:00, пять ночей (Clockenflap 6.12, Централ и Пик 7.12, Ковлун с M+ 8.12, Дисней 9.12), поезд G6080 10.12 прямо в Фужун, утром 23 минуты до гор, три ночи в Чжанцзяцзе, потом Чунцин четырьмя ночами с базой в Цисингане или на 时代天街: 14.12 приезд и парк Цзянтань, 15.12 центр 渝中 с храмом архатов, галереей, Цикоу и шоу «1949», полный день в Улуне 16.12, 17.12 южный берег и Наньшань; 18.12 в 13:15 MU5430 в Шанхай, ночь у Пудуна и 19.12 в 11:50 MU591 — Шереметьево в 17:05, дома вечером в субботу. Внутри Китая ни одного перелёта.",
    pros:["Билеты куплены: China Eastern, 86 926 ₽ за двоих туда и обратно, бронь PEEPS5, всё с багажом","Гонконг первый и почти полный: пять ночей, 5.12 в Джордане к 15:00 — вечер и Temple Street ещё работают","Фестиваль одним днём 6.12, M+ 8.12 во вторник, Дисней 9.12 в среду — будний тариф","Улун влезает целиком: 16.12 поезд 35–50 минут до Улун-Южного, Три моста и ущелье Луншуйся за один день","Фужун встаёт по пути: G6080 останавливается там в 14:15, отдельного переезда нет","Внутри Китая ни одного перелёта: 6 часов поездом, 23 минуты, 2 ч 30 и 40 минут до Улуна","Обратный путь разбит ночью в Шанхае: 20 часов стыковки вместо марш-броска через Урумчи","Дома в субботу 19.12 — на работу только в понедельник 21.12"],
    cons:["18.12 городом не погулять: выезд из отеля в 10:00, вылет в 13:15 — последний день в Чунцине это 17-е","Первый день в Гонконге начинается с пересадки и границы: 11:40 Шэньчжэнь, отель к 15:00","Ночь у Пудуна — плюс 3–4 тыс. ₽ за отель и разбор багажа: 20 часов стыковки","Лантау не влезает: пять ночей в Гонконге, канатка Ngong Ping и Большой Будда остаются","Один поезд G6080 в день — без билетов день переезда идёт через Чанша (6–8 часов)","Улун едем днём-трипом: 2–2,5 часа в дороге туда и обратно плюс 40 минут от станции до парка","15.12 плотный: храм с 8:00, галерея, Цикоу и шоу в 20:00 — день длинный","17.12 тоже плотный: Raffles City и Куйсинлоу утром, гора днём, а в Лаоцзюньдун пускают до 16:30","Дата вылета жёсткая: 18.12 — единственный обратный рейс под купленный билет"],
    budget:"Бюджет: ~413 000 ₽ на двоих, из них авиабилеты 86 926 ₽ — куплены; ночь у Пудуна и трансфер из Шэньчжэня уже в смете",
  },
  {
    id:"chengdu-tibet", title:"Чэнду и Тибет", photo:"Chengdu",
    china:[CD_ARRIVE, CD_PANDA, LHASA_ARRIVE, LHASA_POTALA, LHASA_SERA, LHASA_YAMDROK, GYANTSE_SHIGATSE, SHIGATSE_LHASA, LHASA_BACK, CD_LESHAN, CD_EMEI_UP, CD_EMEI_DOWN, CD_FREE, CD_DEPART],
    hk:[],
    cities:["Чэнду 2 ночи","Лхаса 4","Гьянгдзе 1","Шигадзе 1","Лхаса 1","Чэнду 4"],
    summary:"Две недели по Сычуаню и Тибету: панды, Потала, озеро Ямдрок, Шигадзе, Лэшань и Эмэйшань. Гонконга в этом варианте нет — он остаётся на следующие поездки.",
    pros:["Лхаса, Ямдрок и Шигадзе — Тибет целиком, а не галопом","Панды ровно в первый день, пока нет жары","Второй блок в Чэнду: чайные, еда, шоппинг без спешки"],
    cons:["Тибет: пермит и обязательный гид через агентство (~¥600–900 с человека)","Высота 3 650 м в Лхасе и 4 000 м в Гьянгдзе — нужен запас по дням","Ноябрь: −8…+12, ветер, снег на перевалах"],
    budget:"Бюджет: выше среднего",
  },
  {
    id:"zhangjiajie", title:"Чунцин, Чжанцзяцзе, Фужун и Гонконг с фестивалем", photo:"Zhangjiajie",
    china:[V2_FLIGHT, V2_CQ_ARRIVE, CQ_OLD_SUNDAY, V3_CQ_RAF, V3_TO_ZJJ, V3_ZJJ_AVATAR, V3_ZJJ_TIANZI, V3_FURONG, V3_FURONG_HK, V3_HK_FEST, V3_HK_CENTRAL, V2_HK_DISNEY, V2_KOWLOON_OUT, V2_SZ_DEPART],
    hk:[],
    cities:["в пути 1 ночь","Чунцин 3 ночи","Чжанцзяцзе 3","Фужун 1","Гонконг 4, с фестивалем и Диснеем","Шэньчжэнь 1 у аэропорта"],
    summary:"Двенадцать ночей 27.11–10.12 по билетам China Eastern (пока не куплены): вылет 27.11 через Шанхай, в Чунцине 12:40 28.11, два полных дня городом (храм архатов, галерея, шоу 1949, Лицзиба, Куйсинлоу, крыша Raffles City), три ночи в горах Чжанцзяцзе, ночь в Фужуне у водопада, поезд G6079 в Гонконг 5.12 — и воскресенье 6.12 целиком на Clockenflap. Дальше Централ с Пиком, Дисней во вторник и последний день в музеях Ковлуна; вечером 9.12 поезд в Футянь, ночь у шэньчжэньского аэропорта и 10.12 домой через Пекин.",
    pros:["Фестиваль 6.12 целиком: из Фужуна выезжаем в субботу 5.12, вечером в Коулуне — воскресенье свободно","Оба билета с багажом до конца: 27.11 SVO → PVG → CKG, 10.12 SZX → PKX → SVO, по 13–15 часов в пути","Фужун с ночёвкой: вечерняя подсветка водопада, ради которой туда и едут","Чунцин городом: храм архатов и шоу 1949, Лицзиба, Куйсинлоу и крыша Raffles City на закат","Внутри Китая ни одного перелёта: Чунцин → горы → Фужун → Гонконг поездом","Последняя ночь в 10 минутах от терминала — подъём в 4:30 вместо броска через границу в три часа ночи"],
    cons:["Прилёт 28.11 в 12:40, а не утром 27.11: в Чунцине три ночи вместо четырёх, Улун не влезает","Лантау не влезает: канатка Ngong Ping и Большой Будда остаются на следующую поездку","Два въезда в материковый Китай (28.11 Чунцин, 9.12 Футянь): виза не нужна — безвиз РФ–КНР, но граница дважды","Стыковки короткие: 2 ч 35 в Шанхае и 1 ч 30 в Пекине — билет один, но задержка первого рейса съедает день","Тяньмэньшань по-прежнему не влезает: при трёх днях в парке его не поставить"],
    budget:"Бюджет: ~445 000 ₽ на двоих (на две ночи отелей и еды меньше 14-ночного плана)",
  },
  {
    id:"hk-macau", title:"Гонконг, Макао, Гуанчжоу и Гуйлинь", photo:"Hong Kong",
    hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, GZ_ARRIVE, GZ_DAY, GZ_TO_GL, GL_CRUISE, GL_YANGSHUO, GL_LONGSHENG, GZ_DEPART],
    cities:["Гонконг 4 + Макао 2","Гуанчжоу 2","Гуйлинь и Яншо 4","вылет из Гуанчжоу"],
    summary:"Гонконг с Макао — цель поездки, вместе ровно 6–7 дней. Вторая неделя без перелётов: 47 минут поездом до Гуанчжоу (Кантонская опера, Шамянь, храм Чэнь), потом карстовые горы Гуйлиня и Яншо с круизом по Ли и террасами Лунцзи. Домой из Гуанчжоу.",
    pros:["С самого прилёта погружение в цель поездки: сначала Гонконг целиком, потом Макао паромом","Гуанчжоу: Кантонская опера Захи Хадид, остров Шамянь, храм Чэнь, лучший димсам Китая","Гуйлинь: горы, круиз по Ли, террасы Лунцзи, спа в отеле у реки","Переезды только поездом: 47 мин + 2 ч 30, ни одного перелёта внутри недели"],
    cons:["Декабрь в Гуанси: +10…+15, горы в дымке; дождей мало, террасы без воды","Финал не в Гонконге — обратный рейс домой из Гуанчжоу смотреть отдельно","Макао одна ночь: только старый город и Св. Павел, казино и Тайпа остаются за бортом"],
    budget:"Бюджет: средний",
  },
  {
    id:"shanghai", title:"Гонконг, Макао, Шанхай, Ханчжоу и Сучжоу", photo:"Chengdu",
    china:[], hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, SH_ARRIVE, SH_CITY, SH_TO_SZ, HZ_DAY, HZ_TO_SH, SH_DEPART],
    cities:["Гонконг 5 + Макао 3","Шанхай 3","Сучжоу 1","Ханчжоу 1","вылет из Шанхая"],
    summary:"Гонконг и Макао, потом перелёт в Шанхай: Бунд и французская концессия, сады ЮНЕСКО в Сучжоу, чайные холмы и Западное озеро в Ханчжоу. Самый архитектурный из шести вариантов.",
    pros:["Архитектура сплошная: Бунд, концессия, сады Сучжоу, Западное озеро","Переезды короткие: 25 мин до Сучжоу, 1 ч 20 до Ханчжоу","В Гонконге 5 дней — плотнее, зато остаётся больше на неделю после","Из Шанхая есть прямой рейс домой"],
    cons:["Декабрь в дельте Янцзы: +5…+12 и сырость","Гор и спа нет — это городской отдых","Гонконг → Шанхай перелётом 2 ч 30"],
    budget:"Бюджет: выше среднего",
  },
  {
    id:"sanya", title:"Гонконг, Макао и Хайнань", photo:"Hong Kong",
    china:[], hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, SY_ARRIVE, SY_SPA_DAY, SY_DAYTRIP, SY_LINEUP, SY_BUBBLE, SY_DEPART],
    cities:["Гонконг 5 + Макао 3","Санья 6, курорт со спа"],
    summary:"Гонконг и Макао как цель, затем прямой перелёт на Хайнань: неделя в курорте со спа, морем и тропической природой, без единого переезда до самого отъезда.",
    pros:["В декабре +25 и тёплое море — единственный вариант, где купаешься","Лучшие спа Китая сосредоточены в Санье","Прямой рейс из Гонконга 1 ч 45, около 10 рейсов в неделю","Внутри второй недели вещи распаковываются один раз"],
    cons:["Красивых зданий и старых городов почти нет — это чистый пляж","Курорты Ялонг-Бэй дороже гонконгских отелей","Домой через Гонконг или Шэньчжэнь — стыковку смотреть отдельно"],
    budget:"Бюджет: выше среднего",
  },
];

return {CITIES, DATES, VARIANTS, HK_DEPART};
})();
