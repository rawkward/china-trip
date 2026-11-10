const TRIP_ITINERARY = (function(){
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
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"19:30, 75 минут, зал вращается на 360°; по понедельникам у театра выходной", cost:"¥279"},
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


const V3_CQ_WULONG = {city:"cq", title:"Улун: Три моста и ущелье", sub:"Поезд 35–50 минут, оба объекта за день, вечером молл у отеля", places:[
  {k:"wulong", name:"Поезд Чунцин-Восточный → Улун-Южный, около 7:00", tag:"transport", note:"Скоростной 35–50 минут, ¥76; билеты за 14 дней на 12306 или Trip.com, обратный брать сразу. От станции до парка ещё 40 минут автобусом или такси — это и есть весь запас дня"},
  {k:"three_natural_bridges", name:"Тяньшэн саньцяо (Три моста)", tag:"sight", note:"Три природных моста в карстовой воронке, 2–3 часа; спуск по ступеням и лифт наверх, утром меньше групп. Снимали «Трансформеры» и «Проклятие золотого цветка», а не «Аватар»", cost:"¥125"},
  {k:"longshuixia", name:"Ущелье Луншуйся", tag:"sight", note:"10 минут от Трёх мостов, тропа по дну ущелья с водопадами, 1,5–2 часа; межсезонный тариф, в декабре бывает скользко — микрошипы не помешают", cost:"¥85"},
  {k:"chongqing", name:"Возврат в Чунцин", tag:"transport", note:"Вечерний поезд, в городе к 19:00–20:00; ужин у отеля в Цзефанбэе"},
  {k:"jiefangbei", name:"Короткий заход в молл у отеля", tag:"shopping", note:"После Улуна на город сил немного, поэтому это не отдельный день, а полтора-два часа рядом с базой. База на 时代天街 (Дапин) — молл 龙湖时代天街 прямо под отелем, 10:00–22:00: одежда и обувь, китайские бренды (Li-Ning, Anta, Xiaomi, Miniso), супермаркет и еда на любом этаже; вечерний поезд из Улуна ставит вас в город к 19:00–20:00, до закрытия остаётся два часа. База в Цисинган — до 解放碑 10–15 минут пешком: 大都会东方广场, 重庆时代广场 и Apple Store на 邹容路 108, тоже до 22:00, и это уже центр с вечерней подсветкой. Крупное и тяжёлое брать здесь, а не в Гонконге: впереди один перелёт и один поезд, а с чемоданами по горам не ходят; в Шанхае на покупки есть только вечер 18.12. Ужин — в том же молле, чтобы не тратить вечер на дорогу.", cost:"покупки по вкусу"},
]};

const V3_TO_ZJJ = {city:"zjj", title:"Чунцин → Чжанцзяцзе", sub:"Поезд 2 ч 29, днём Цзиньбяньси", places:[
  {k:"chongqing", name:"Поезд Чунцин-Восточный → Чжанцзяцзе-Западный", tag:"transport", note:"07:12 → 09:41 или ближе к 9 утра; больше 20 рейсов в день", cost:"¥197–273"},
  {k:"zhangjiajie", name:"Заселение в Улинъюане", tag:"hotel", note:"У Восточных ворот — ближе к лифту Байлун, Тяньцзышаню и Шили Хуалан"},
  {k:"zhangjiajie", name:"Тропа Цзиньбяньси", tag:"sight", note:"7,5 км по ровной долине у ручья — самая лёгкая тропа парка"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"", cost:"¥80–120"},
]};

const V3_ZJJ_AVATAR_TIANZI = {city:"zjj", title:"Юаньцзяцзе и Тяньцзышань: горы «Аватара» и «море пиков»", sub:"Лифт Байлун вверх, Мицунтай и мост Первого кадра, потом эко-автобус на Тяньцзышань и канатка вниз", places:[
  {k:"zhangjiajie", name:"Лифт Байлун", tag:"sight", note:"Подъём на плато за минуту; очередь с 9:00 — приходить к открытию. Билет отдельно от пропуска, <a href=\"https://trip.tpo.li/937Lbk5y\" target=\"_blank\" rel=\"noopener\">брать онлайн на дату</a>", cost:"¥65"},
  {k:"zhangjiajie", name:"Мост Первого кадра и Мицунтай", tag:"sight", note:"Те самые горы из «Аватара», смотровые на гребне"},
  {k:"zhangjiajie", name:"Пропуск в парк", tag:"sight", note:"Низкий сезон с 01.12: ¥147 вместо ¥225–239, действует 4 дня с многократным входом, эко-автобусы внутри включены. <a href=\"https://trip.tpo.li/5omi77gs\" target=\"_blank\" rel=\"noopener\">Билет на Trip.com</a>", cost:"¥147"},
  {k:"zhangjiajie", name:"По желанию: Янцзяцзе", tag:"optional", note:"Соседняя зона — 天波府, 乌龙寨, стены пиков; если после Юаньцзяцзе остались силы, автобусом 20–30 минут. <a href=\"https://trip.tpo.li/FqOcd1Mm\" target=\"_blank\" rel=\"noopener\">Канатка Янцзяцзе, ¥76 туда-обратно</a>", cost:"¥76"},
  {k:"zhangjiajie", name:"Переезд на Тяньцзышань", tag:"transport", note:"Эко-автобус по плато 20–30 минут: Юаньцзяцзе и Тяньцзышань — соседние зоны одного парка, отдельного билета не нужно"},
  {k:"zhangjiajie", name:"Тяньцзышань: «Пик императорской кисти», «Фея, разбрасывающая цветы»", tag:"sight", note:"Автобус доходит до вершины, вниз — канаткой. Панорамы «моря пиков» лучшие в парке. Выбирай смотровые у самого выхода на канатку: спускаться в темноте по ступеням в декабре не надо"},
  {k:"zhangjiajie", name:"Канатка Тяньцзышаня вниз", tag:"transport", note:"¥72 в одну сторону по местным тарифам; комбо «3 канатки + лифт Байлун» за ¥193–238 выгоднее, чем брать по одному. Вечером — ужин и шоу в Улинъюане, если останутся силы", cost:"¥72"},
  {k:"zhangjiajie", name:"Ужин в Улинъюане", tag:"food", note:"День плотный: выходим к открытию, между зонами не задерживаемся. Ночь вторая и последняя в горах: утром 13.12 выселяемся с чемоданами и уезжаем в город", cost:"¥80–120"},
]};

const V3_ZJJ_TIANMEN = {city:"zjj", title:"Тяньмэньшань по маршруту C и переезд в город", sub:"Выселение из Улинъюаня утром, чемоданы в городском отеле, Тяньмэнь днём, вечером 七十二奇楼 и ночь в городе", places:[
  {k:"zhangjiajie", name:"Выселение и переезд в город с чемоданами", tag:"transport", note:"Выезд из Улинъюаня 7:00–7:15: выселение до 12:00, но уезжаем раньше. Didi 35–40 минут и около 30 км (¥120–150), чемоданы оставить на стойке Hampton на 武陵山大道 1 (заезд с 14:00, багаж принимают раньше), дальше 10 минут на Didi до нижней станции канатки Тяньмэня — к 8:00, когда канатка начинает возить. Билеты продают 7:30–16:00, к полудню наверху очередь и облака"},
  {k:"tianmen", name:"Маршрут C: канатка к Небесным вратам", tag:"sight", note:"Большая канатка 7,5 км над городом закрыта с 13.10.2026 на реконструкцию, дату открытия не объявляли — поэтому едем по C: шаттл до 山门, короткая канатка 天门洞快线索道 до самого грота, дальше семь эскалаторов сквозь гору наверх. Билет ¥288 со страховкой, продают по паспорту в WeChat «张家界一机游» или на Trip.com. Серпантин 通天大道 (99 поворотов, 10,8 км) под канаткой: проехать по нему в маршруте C нельзя — автобусы по нему не ходят, — но из окна канатки 99 поворотов видно сверху.", cost:"¥288"},
  {k:"tianmen", name:"999 ступеней — по желанию, эскалатор вместо них", tag:"optional", note:"Лестницу «上天梯» к гроту можно не идти: рядом эскалатор 登天门扶梯 — 5 секций, ¥32 наверх, вниз бесплатно. В декабре ступени в наледи — это тот случай, когда эскалатор не компромисс, а разумный выбор"},
  {k:"tianmen", name:"Стеклянные тропы и смотровые наверху", tag:"sight", note:"Западная и восточная стеклянные тропы, 鬼谷栈道 вдоль скалы, панорамы на 1518 м. Стекло закрывают при обледенении и ветре — тогда идём обычными тропами, они работают всегда. Наверху −5…+2, нужны шапка, перчатки и нескользящая подошва. Кольцо по западной линии: 高空云廊 (мост влюблённых) → 珙桐园 → 盘龙崖玻璃栈道 → западная стеклянная тропа (¥5 за бахилы) → 鬼谷栈道 → подвесной мост → 樱桃湾 с храмом 天门山寺; оттуда по желанию лесная канатка на 云梦仙顶 за ¥25. Западная линия — около 4 часов, большой круг по всему верху — 6–8, в декабре светлого времени столько нет, поэтому идём западом."},
  {k:"tianmen", name:"Вечером: шоу или 七十二奇楼", tag:"festival", note:"День 13.12 целиком в городе, поэтому после Тяньмэня никуда не едем: вечер либо у 七十二奇楼 — подсветка к 19:00–19:30, сценки по улицам, костёр около 21:30, отель в 100 метрах, — либо на шоу «Тяньмэнь Хусянь» в 20:20 у подножия горы; тогда костёр пропускаем", cost:"¥80–238", picks:[
    {name:"七十二奇楼 (72 Wonder Towers)", note:"109,9-метровая башня в виде туцзяской свайной постройки — самая высокая в мире в этом виде, с квадратным сквозным проёмом 38×28 м посередине: задумано так, чтобы «переглядываться» с Тяньмэньдуном в километре отсюда. Вечером включают 36 000 ламп и 7D-проекцию на весь фасад, по улицам внутри идут больше двадцати иммерсивных сценок, около 21:30 — костёр и туцзяская «пляска рук» под диджея. Подсветку включают к 19:00–19:30 — приходить к этому времени. Вход 08:00–23:00: днём ¥20–48, вечером ¥80–88, но если войти до 16:30 по дневному билету, вечер уже включён; в тариф Hampton билет на вечерний 七十二奇楼 входит. Отель в 100 метрах: после костра идём пешком, машина не нужна", cost:"¥80–88", rec:true},
    {name:"《天门狐仙》Tianmen Fox Fairy", note:"Открытая сцена в ущелье Тяньмэня, 20:20–21:30, ¥238; театр в 10 минутах от нижней станции канатки. Вариант вместо башни, если хочется сцену: тогда костёр пропускаем, после шоу 10 минут на Didi до отеля", cost:"¥238"},
    {name:"《魅力湘西》Charming Xiangxi", note:"Крытый зал в Улинъюане, два сеанса — 18:40 и 20:00. Если небо в облаках и ветер, в зале тепло", cost:"¥138–228", dim:"зал в Улинъюане, а ночуем в городе — 30 км, не вариант"}
  ]},
  {k:"qilou72", name:"七十二奇楼: как совместить с Тяньмэнем", tag:"optional", note:"Башня стоит в городской части Чжанцзяцзе (永定, 武陵山大道 1), а не в Улинъюане: от нижней станции канатки Тяньмэня 4 км. В разбивке 2+1 это не «успеть вернуться в горы», а вечер у своего отеля: Тяньмэнь до последней канатки, ужин у канатки, к 19:00–19:30 в 七十二奇楼 на подсветку и сценки, костёр в 21:30, отель в 100 м. Официальных сеансов нет: программа плавает по дням и погоде, расписание смотреть в тот же день в WeChat-аккаунте景区 или на табло у входа", cost:"¥80–88"},
  {k:"tianmen", name:"Назад тем же путём", tag:"transport", note:"Сверху эскалаторами к гроту, потом канаткой к 山门 и шаттлом или Didi к нижней станции канатки (10 минут), ужин. В отель 10 минут на Didi, а не 40–50 минут в Улинъюань. Если едем на «Тяньмэнь Хусянь», из города не уезжаем: театр в 10 минутах от нижней станции"},
  {k:"zhangjiajie", name:"Ужин в городе у канатки", tag:"food", note:"Даюн гучэн и 三下锅 рядом с нижней станцией — 20 минут пешком от 山门. После ужина 10 минут на Didi до 七十二奇楼 или отеля", cost:"¥80–120"},
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

const V3_HK_FEST = {city:"hk", title:"Clockenflap: день 3 и закрытие", sub:"Воскресенье 6.12: утро в Causeway Bay — секонд-хенд, продуктовый и храм, к сценам после полудня. Дата фестиваля зафиксирована", places:[
  {k:"causeway_bay", name:"Завтрак в Causeway Bay", tag:"food", note:"Утро без спешки и без переездов: завтракаем рядом с отелем на Shelter Street, дальше весь квартал обходим пешком — от отеля до Haven Street 8 минут, до храма Тинь Хау 10 минут, до библиотеки 5 минут"},
  {k:"donki_cwb", name:"Продуктовый: вода и еда на фестиваль", tag:"shopping", note:"DON DON DONKI в 名珠城, 百德新街 22–36, этажи 1–4: работает круглосуточно, готовые бэнто, онигири, вода и снеки — берём с запасом на день. Дешевле и проще по базовому списку — Wellcome на Kingston Street в Fashion Walk, три минуты от Haven Street; воду удобнее покупать там, а еду — в DONKI, где есть готовое", cost:"HK$40–80"},
  {k:"tin_hau_temple", name:"Храм Тинь Хау, 天后廟", tag:"sight", note:"10 Tin Hau Temple Road, вход бесплатный, открыт 8:00–17:00 — приходить не позже 16:00. Памятник с 1982 года, колокол отлит в 1747-м: небольшая двухзальная кумирня с внутренним двориком, 20–40 минут. От станции 天后 (Island line) три–пять минут пешком, от отеля десять минут через Виктория-парк"},
  {k:"luddite_vintage", name:"Секонд-хенд: Luddite Clothing Co., 希雲街 15A", tag:"shopping", note:"Тот самый винтажный магазин в старом пассаже на Haven Street: японский деним, американские куртки 70–90-х, японские рубашки и небольшой, но настоящий женский отдел. Открывается в 13:00 и работает до 21:00 — раньше двери просто закрыты, поэтому визит ставим на час дня. В двух минутах Fashion Walk и Paterson Street, если захочется зайти ещё куда-то"},
  {k:"central_library", name:"Библиотека → автобус до фестиваля", tag:"transport", note:"От Haven Street до 香港中央圖書館 (高士威道 66) 10–12 минут пешком вдоль Causeway Road, по дороге Виктория-парк. Нужна остановка 香港中央圖書館 на 高士威道 в сторону Централа, у самого здания: автобус 25 идёт до 中環 5號碼頭 — это Central Ferry Piers, от них до входа на Central Harbourfront 5–7 минут пешком. Тем же маршрутом идёт 10 до 堅尼地城: выходить на 中環街市, дальше 10–12 минут пешком. Трамвай от библиотеки до 中環 — около 20 минут, платить Octopus", cost:"HK$5–6"},
  {k:"central_harbourfront", name:"Перекус на набережной до входа", tag:"food", note:"Правила по своей еде смотрят на входе — если с сумкой не пустят, едим до фестиваля: кафе и фуд-корт в IFC (8 Finance Street, 10 минут пешком от пирсов) или в 添馬公園 рядом с площадкой. Воду и снеки из DONKI можно оставить в камере хранения на входе"},
  {k:"central_harbourfront", name:"Clockenflap, день 3", tag:"festival", note:"Сцены с полудня до 23:00, Central Harbourfront; расписание за месяц на clockenflap.com. Закрытие фестиваля — самый плотный вечер, к главной сцене приходить заранее", cost:"однодневный билет"},
  {k:"genki_cwb", name:"Ужин после феста: Genki Sushi, Windsor House", tag:"food", note:"Shop 203–204, 2/F, Windsor House, 311 Gloucester Road: конвейер с поездом-доставкой, работает с 11:30 до позднего вечера, HK$60–90 с человека. От Central Harbourfront: метро 中環 → 銅鑼灣 (8 минут), дальше до Windsor House 5 минут пешком и до отеля ещё 5; если сил нет совсем — доехать до 天后 и 10 минут через парк", cost:"HK$60–90"},
]};

const V3_HK_CENTRAL = {city:"hk", title:"Централ и Пик", sub:"Эскалатор, арт-кварталы, храм, вершина, вечером шопинг", places:[
  {k:"colour_harbour", name:"Рекомендация: 7-Colour Harbour 彩虹禮巷, 閣麟街 28", tag:"shopping", note:"Рекомендация, не обязательный пункт: сувениры, придуманные в Гонконге, — магниты с трамваями и вывесками, миниатюрные «закуски», которые нельзя съесть, открытки и значки. 10:00–22:00, в пятницу и субботу до 23:00. Стоит ровно у нижней станции эскалатора Central–Mid-Levels: заходим по пути наверх, отдельного крюка нет. Дороже Temple Street в два-три раза, зато этих вещей на лотках нет; крупное и тяжёлое всё равно брать в конце поездки. Все точки Гонконга, которые мы собрали, лежат одним списком на карте — удобно открыть с телефона и отмечать пройденное: <a href=\"https://maps.app.goo.gl/WVb7ZLsr4ebW1hqM7?g_st=i\" target=\"_blank\" rel=\"noopener\">Гонконг · Евгения</a>", cost:"HK$30–150"},
  {k:"pmq", name:"Central Mid-Levels и PMQ", tag:"sight", note:"Эскалатор едет только в одну сторону и разворачивается по часам: с 6:00 до 10:00 — вниз, с Mid-Levels к Централу (так едут на работу), а с 10:00 до полуночи — вверх. То есть утром до десяти подняться по нему нельзя, а весь смысл поездки — проехать 800 метров вверх через SoHo. Поэтому завтракаем внизу (Lan Fong Yuen, 結志街 2) и встаём на нижнюю ступень к 10:00: вход с 皇后大道中 у Central Market, выходить можно на любой пересекающей улице, по пути 彩虹禮巷, PMQ и Голливуд-роуд. Вниз потом пешком или на такси", cost:"HK$40"},
  {k:"tai_kwun", name:"Tai Kwun и Man Mo Temple", tag:"sight", note:"Арт-центр в бывшей тюрьме, вход бесплатный"},
  {k:"ying_kee", name:"Рекомендация: 英記麵家 Ying Kee, 西營盤高街 28", tag:"food", note:"Рекомендация, не обязательный пункт и честно про географию: это не Централ, а 15–20 минут вверх по Hollywood Road от Tai Kwun, 高街 28. Семейная лапшичная на пять столов, 09:00–19:00, только наличные: домашний чашао (叉燒), говяжьи рёбра с лапшой (牛腩麵), 雙拼撈麵 с двумя начинками, ~HK$50–70. Идти сюда стоит, если хочется миски без туристов; после 19:00 закрыто, поэтому это обед, а не ужин", cost:"~HK$60"},
  {k:"peak_tram", name:"Трамвай на Пик", tag:"sight", note:"Онлайн дешевле; лучше к 16:30 — закат и сумерки", cost:"HK$116"},
  {k:"hong_kong_park", name:"Вечер шопинга: IFC и Causeway Bay 銅鑼灣", tag:"shopping", note:"Спуск с Пика около 18:30 — дальше всё пешком и на метро. IFC mall (8 Finance St, 10:00–22:00) в 10 минутах вниз от нижней станции трамвая: марки, электроника и Apple, City'Super, Landmark через дорогу. От 中環 до Causeway Bay 8 минут метро: Times Square (勿地臣街 1) и SOGO (555 Hennessy Road) работают до 22:00 — с 19:00 выходит три часа, час в Централе и полтора-два в Causeway Bay. Ужин после покупок: рестораны на верхних этажах моллов открыты до 22:30–23:00. В Гонконге нет налога с продаж — косметика, парфюм, сумки, кроссовки и техника тут на 10–25 % дешевле материковых цен; возврата НДС здесь не бывает, он только в Китае при вылете. Крупное и тяжёлое всё равно брать в конце поездки: с сумками ехать в горы — свои же проблемы, в Чунцине и Шанхае то же самое обычно дешевле."},
  {k:"lab_concept", name:"Xiaomi 小米之家 Lab Concept, 金鐘", tag:"shopping", note:"Официальный магазин Xiaomi в Адмиралти: 金鐘道93號, Lab Concept, 1樓 D07-08 鋪 — одна остановка метро от 中環 или 10 минут пешком, ровно между Централом и Тай Куном. Часы на сайте не публикуются (это авторизованная, а не прямая точка) — уточнить по +852 2698 8871. Спрашивать только 行貨 — гонконгскую версию с глобальной прошивкой, русским языком и Google Play; 國行 и 水貨 дешевле, но это китайская прошивка без Google и без нормальных пуш-уведомлений. До оплаты включить планшет, выбрать русский язык и открыть Play. Ориентир цен: Pad 8 8/256 — HK$2 999, 12/256 — HK$3 399, Redmi Pad 2 Pro 8/256 — HK$1 999–2 199; адаптера в коробке Pad 8 нет, 45 Вт USB-C брать свой.", cost:"от HK$1 999"},
  {k:"lan_fong_yuen", title:"Обед в Централе: пять вариантов", tag:"food", note:"Обед между эскалатором и Пиком — брать по настроению.",picks:[{name:"Лан Фон Юэн 蘭芳園, 結志街 2",note:"С 1952 года: стойка, общие столы, тот самый молочный чай с шёлковой пенкой (絲襪奶茶) и свиная булочка с маслом. Очередь двигается быстро, но в обед толпа — заходить до 12:00 или после 15:00",cost:"~HK$40–60",rec:true},{name:"Mak's Noodle 麥奀雲吞麵世家, 威靈頓街 77",note:"Кантонская классика: брать вонтоны с лапшой в супе (雲吞麵) — маленькая пиала, тонкая лапша, креветки в тесте. Порции небольшие: по миске каждому плюс 油菜 (зелень) и 炸醬麵 на двоих, ~HK$50–70 с человека. Не путать с 沾仔記 через дорогу — там тоже хорошо, но это другое место; 麥文記 с похожим именем стоит в Джордане, 白加士街 51, и берётся в день прилёта",cost:"HK$50–70"},{name:"Димсамы: 鼎點 Ding Dim 1968",note:"Лучшие димсамы в этом плане: 雲咸街 59, 11:00–22:00 (пт–сб до 23:00), от выхода D2 中環 три минуты. Брать набор на одного — в нём и харгау, и сяомай, и рис с мясом, выходит дешевле, чем набирать по позициям; на двоих берут два набора и одну 腸粉 на пробу. ~HK$90–120 с человека",cost:"HK$90–120"},{name:"Лапша: 沾仔記 Tsim Chai Kee",note:"Мишленовский Bib Gourmand и очередь в обед: 威靈頓街 98, 9:00–22:00. Брать вонтоны с лапшой (雲吞麵) или лапшу с говядиной (牛肉麵), можно комбо из двух начинок — начинок всего три: вонтоны, рыбные шарики, говядина. Порции небольшие, счёт ~HK$50–70; за стол подсаживают. Через дорогу Mak's — выбирать одно из двух, не оба",cost:"HK$50–70"},{name:"上環街市熟食中心",note:"Та самая дешёвая столовая для местных: 2-й этаж Sheung Wan Municipal Services Building, 皇后大道中 345. Два десятка прилавков — рис с мясом, лапша, тосты, чай; за столами работяги и торговки с рынка. Популярнее всего Shui Kee Coffee (классическая чайная, гонконгский тост). Открыто 6:00–20:00, но к 15:00 половина прилавков уже мыть посуду — идти в обед",cost:"HK$40–60"}]},
  {k:"catherine_bakery", name:"Выпечка: Catherine Bakery", tag:"food", note:"Китайская пекарня на 皇后大道中 378 (5 минут от выхода A2 上環): яичные тарталетки, булочки с кремом (奶油包), 老婆餅, пирожки с чашао. Берут на вынос, очередей туристических нет, цены вдвое ниже сетевых", cost:"HK$8–25"},
  {k:"man_wa_lane", name:"Рекомендация: 文華里 Man Wa Lane, «аллея печатей»", tag:"shopping", note:"Рекомендация, не обязательный пункт: переулок между Bonham Strand и Connaught Road Central, ряд лотков, где режут китайские именные печати (印章) и резиновые штампы. Готовая печать от ~HK$100, с деревом дороже; простую режут при вас, именную принимают на следующий день — уточнять на месте. Платить после оттиска на бумаге. Пять минут от выхода A2 上環 и по пути между 上環街市 и Catherine Bakery, лавки закрываются вместе с торговым днём — заходить до 18:00", cost:"от HK$100"},
  {k:"central_hk", name:"Ужин в Централе", tag:"food", note:"", cost:"HK$150–250"}
]};

const V3_HK_KOWLOON = {city:"hk", title:"Ковлун: паром, M+ и набережная", sub:"Star Ferry с утра, димсам, музеи, Avenue of Stars", places:[
  {k:"ngong_ping", name:"Ответвление: канатка и Будда с утра", tag:"optional", note:"В будни канатка открывается в 10:00 и работает до 18:00, туда-обратно HK$295, к открытию очередь 5–10 минут. Из Causeway Bay выехать в 9:00 — Island line до 中環 и дальше Tung Chung line, в 東涌 к 9:55, первая кабинка в 10:00 — наверху 10:25; Будда и монастырь до 11:45, вниз 12:15, Citygate Outlets 12:30–14:00 с обедом на верхнем этаже, обратно в Causeway Bay к 15:00. Тогда M+ сдвигается на 15:00–17:45 (вторник открыт, закрывается в 18:00, таймслот брать на 15:00), а вечер остаётся как записан: Avenue of Stars и Symphony of Lights в 20:00. Если канатка не нужна, день идёт по плану — паром, завтрак и M+ с 10:00"},
  {k:"wan_chai_pier", name:"Утро: Star Ferry 灣仔 → 尖沙咀", tag:"transport", note:"День начинаем с парома через гавань: из отеля 25–30 минут пешком (2,2 км) по набережной до 灣仔 pier на 鴻興道 (или 5–7 минут на такси), паромы с 7:30 каждые 8–12 минут, в пути 8–10 минут, HK$5 по Octopus — вторник будний, поэтому дешевле. С 尖沙咀 Star Ferry Pier до Bolton Cafe на 亞士厘道 пять минут пешком, до M+ — 20 минут вдоль West Kowloon (или 5 минут на такси). Обратно вечером тем же паромом или метро от 尖沙咀", cost:"HK$5"},
  {k:"sham_shui_po", title:"Завтрак в Ковлуне: два варианта", tag:"food", note:"Завтракаем уже на той стороне: димсам в Шам Шуй По или ретро-冰室 в трёх минутах от пирса.",picks:[{name:"димсам Tim Ho Wan 添好运, 深水埗",note:"Рекомендация, не обязательный пункт: ту самую точку годами звали самой дешёвой мишленовской в мире — звезду 深水埗 держала с 2010 года, но в гиде 2026 у неё Bib Gourmand, то есть «вкусно и недорого», а не звезда. 福榮街 9-11, метро 深水埗 выход B2, открыто 8:00–22:00 — завтракать к открытию, к 11:00 очередь по улице. Брать: 酥皮焗叉燒包 (печёные булочки с чашао), харгау, рисовый рулет с креветкой; ~HK$70–90 с человека. Без очереди — филиал на Hong Kong Station в IFC (по пути 7.12) или 東涌 у канатки, если Лантау поедем",cost:"~HK$80",rec:true},{name:"保頓冰室 Bolton Cafe",note:"Ретро-冰室 на 亞士厘道 20A: 豬油撈飯 (рис с топлёным свиным жиром), жареная куриная нога, гонконгский тост и молочный чай. 7:30–22:00, ~HK$60–90. В трёх минутах от выхода L5 尖沙咀 — удобно перед M+, который открывается в 10:00",cost:"HK$60–90"}]},
  {k:"gwing_kee", title:"Обед в Ковлуне: четыре варианта", tag:"food", note:"После музея обед выбираем по настроению — всё в пяти–десяти минутах от M+ и пирса.",picks:[{name:"炯記燒味 Gwing Kee Roasted",note:"Жареное мясо с рисом: 燒味雙拼飯 (два вида мяса) — HK$55–65, 燒鵝雙拼飯 с уткой — HK$75, есть 燒鵝撈粗 с лапшой. 樂道 19, Anson House, три минуты от 尖沙咀; едят и в зале, и на вынос, всё быстро. Удобно между музеями",cost:"HK$55–80",rec:true},{name:"Mak Man Kee 麥文記麵家",note:"Вонтоны с лапшой в супе, ради которых сюда и идут: креветки в тонком тесте, лапша на утином яйце, бульон из сушёной рыбы. Плюс 蝦子撈麵 — лапша с креветочной икрой. Зал крошечный, карты не принимают, только наличные, миска ~HK$50–65. От 尖沙咀 до Jordan две остановки метро, 白加士街 51",cost:"HK$50–65"},{name:"Bolton Cafe 保頓冰室, 亞士厘道",note:"Та же 冰室, что в завтраке: 豬油撈飯 (рис с топлёным свиным жиром), жареная куриная нога, тост и молочный чай, 7:30–22:00, ~HK$60–90. Три минуты от выхода L5 尖沙咀 и пять от пирса — сюда удобно сесть, если после музея не хочется ничего искать",cost:"HK$60–90"},{name:"Temple Street 廟街夜市",note:"Рынок и уличная еда на открытом огне: лотки выходят к 16:00, пик после 19:00, поэтому это скорее вечерний вариант — днём половина точек закрыта. Если идём сюда днём, берём лавки с морепродуктами и чайные, что работают с утра; от 尖沙咀 до 佐敦 или 油麻地 две остановки метро",cost:"HK$80–120"}]},
  {k:"m_plus", name:"Музей M+", tag:"sight", note:"Вторник — открыт (по понедельникам закрыт), таймслот онлайн; если утром была канатка, брать слот на 15:00 — музей работает до 18:00", cost:"HK$190"},
  {k:"kowloon_park", name:"Музей искусств Гонконга", tag:"sight", note:"Бесплатно"},
  {k:"avenue_of_stars", name:"Avenue of Stars и Star Ferry", tag:"sight", note:"", cost:"HK$5"},
  {k:"tsim_sha_tsui", name:"Рекомендация: сувениры Hong Kong Souvenir, 海防道 45", tag:"shopping", note:"Рекомендация, не обязательный пункт: 海防道 45 (45 Haiphong Road), 3 минуты от станции Tsim Sha Tsui и рядом с Harbour City. Магниты, открытки, футболки, чай и мелочи по нормальным ценам, без накрутки с Nathan Road; берут наличные и Octopus. Крупные и тяжёлые вещи всё равно выгоднее брать в конце поездки, в Чунцине", cost:"HK$30–150"},
  {k:"victoria_harbour", name:"Symphony of Lights", tag:"sight", note:"20:00, набережная Tsim Sha Tsui у Avenue of Stars и Музея искусств; приходить к 19:45"},
  {k:"times_square", name:"Вечером: домой в отель (по желанию — Causeway Bay)", tag:"transport", note:"По плану после Symphony of Lights — возвращение к отелю: паромом 尖沙咀 → 灣仔 (8–10 минут, HK$5), дальше 15 минут пешком вдоль набережной, или метро 尖沙咀 → 金鐘 → 天后, около 20 минут. Causeway Bay и Harbour City отдельным заходом больше не ставим. Если силы останутся, по дороге можно пройтись по улицам с ТЦ в Causeway Bay: Times Square стоит на 勿地臣街 1 (Matheson Street), SOGO — 軒尼詩道 555, вокруг квартал 百德新街 и 京士頓街. От отеля это 15 минут пешком или одна остановка метро 天后 → 銅鑼灣; витрины в рождественских огнях с 20.11, магазины до 22:00"},
  {k:"k11_musea", name:"Xiaomi 小米之家 旺角 創興廣場", tag:"shopping", note:"Главный официальный магазин Xiaomi: 旺角彌敦道601號 創興廣場 地下 D-F 鋪, 10:30–22:30, +852 2698 8871. Метро 旺角 выход E1 — 5 минут пешком; от 尖沙咀 две остановки, от Causeway Bay — Island line до 金鐘 и Tsuen Wan line, около 20 минут. Работает до 22:30, поэтому влезает и после Symphony of Lights. Спрашивать 行貨 — гонконгскую версию с глобальной прошивкой, русским языком и Google Play; в чеке должно стоять название магазина. 國行 и 水貨 дешевле, но это китайская прошивка без Google и без пуш-уведомлений, и именно её продают в 先達廣場 у выхода B2 — не путать с 創興廣場 у выхода E1. До оплаты включить планшет, выбрать русский и открыть Play. Цены фиксированные: Pad 8 8/256 — HK$2 999, 12/256 — HK$3 399, Redmi Pad 2 Pro 8/256 — HK$1 999–2 199. Оплата: наличные HKD, Octopus, иностранные Visa/Mastercard; «Мир» не принимают. Перед выходом позвонить и спросить наличие — в декабре планшеты выметают.", cost:"от HK$1 999"},
  {k:"cafe_match_box", name:"Вечер-вариант: 喜喜冰室 Cafe Match Box", tag:"food", note:"Чаа-чаан-тэн в стиле 1980-х: вывески, витрины, старые меню. 百德新街 57, Fashion Walk, 7:30–22:00 — ровно на пути по Causeway Bay. Брать 菠蘿油 (булочка с маслом), 沙嗲牛肉麵 и молочный чай", cost:"HK$50–80"},
  {k:"tsui_yuen", title:"Десерт: три варианта", tag:"food", note:"Сладкое — уже по дороге к отелю: две лавки в Causeway Bay и одна у 炮台山.",picks:[{name:"翠苑甜品專家 Tsui Yuen Dessert",note:"Старая лавка сладких супов на 波斯富街 83A, три минуты от 銅鑼灣. Брать 楊枝甘露 — манго, саго и помело; есть версия 多芒 с двойным манго, ~HK$32–40. Порции большие, одной на двоих хватает",cost:"HK$32–40",rec:true},{name:"人和荳品廠 Yan Wo Dou Bun Chong (Causeway Bay)",note:"Соевая лавка старой школы на 渣甸街 (Jardine's Bazaar): соевое молоко, тофу-пудинг 豆腐花 и жареный тофу с креветкой, HK$20–40 с человека. Работают примерно до 22:00, всё быстро, можно на вынос; от отеля пять минут пешком, ориентир — вывеска 人和荳品廠 у выхода F1 銅鑼灣. Не десерт в европейском смысле, зато совсем рядом и по-районному дёшево",cost:"HK$20–40"},{name:"福元湯圓 Fook Yuen",note:"湯圓 — клейкие рисовые шарики с кунжутной или арахисовой начинкой в имбирном сиропе, лепят руками почти тридцать лет, лавка в мишленовском гиде. 炮台山 福元街 7號, 利都樓 地下 I-1 舖, выход B 炮台山: 12–15 минут пешком от отеля или одна остановка метро 天后 → 炮台山. Работают с обеда до поздней ночи, ~HK$30–50 за миску — самый близкий к отелю вариант, если идём домой через 炮台山",cost:"HK$30–50"}]},
  {k:"sham_shui_po", name:"Альтернатива: Шам Шуй По — Garden Hill, Mei Ho House, рынок", tag:"optional", note:"Три точки в одном районе вместо музея: холм за хлебозаводом Garden (15 минут по ступеням, вид на весь Ковлун, посидеть 1,5 часа), музей-хостел Mei Ho House про старое гонконгское жильё (вт–вс 10:00–18:00, бесплатно, экскурсия по-английски ~40 минут) и самый дешёвый рынок города (20 минут — час).", cost:"бесплатно"},
  {k:"k11_musea", name:"Альтернатива: K11 Musea, Nan Lian Garden, Choi Hung, Walled City Park", tag:"optional", note:"K11 Musea у набережной — бесплатная смотровая на 6-м этаже на Avenue of Stars, 20–30 минут. Nan Lian Garden с монастырём Chi Lin — Diamond Hill, выход C2, сад до 21:00, монастырь до 16:30, бесплатно. Ещё два варианта: радужный Choi Hung Estate и Kowloon Walled City Park с выставкой декораций. Все четыре — в справочнике «Места» с пометкой «альтернатива».", cost:"бесплатно"}
]};

const V3_HK_DISNEY = {city:"hk", title:"Диснейленд", sub:"Среда — низкий тариф и короткие очереди", places:[
  {k:"disneyland", name:"Гонконгский Диснейленд", tag:"sight", note:"С 20 ноября полный рождественский декор; будний день дешевле", cost:"HK$639"},
  {k:"donki_cwb", title:"Прощальный ужин: пять вариантов рядом с отелем", tag:"food", note:"Парк в декабре закрывается около 20:30, дома будем к 21:30–22:00 — в Централ ради димсамов ехать уже поздно, а наутро выезд из отеля в 06:45. Поэтому всё, что ниже, в пяти–десяти минутах от Rosedale, и ничего не надо бронировать.",picks:[{name:"DON DON DONKI 驚安の殿堂, 名珠城",note:"Круглосуточный японский супермаркет в том же квартале: 1/F–4/F, Pearl City, 22–36 Paterson Street, четыре минуты от отеля. Готовые бэнто, суши-сеты, онигири, десерты, вода и снеки — берём на вынос и едим в номере, пока собираем вещи. Самый безопасный вариант, если из парка вышли позже 21:30: работает всегда и никуда не надо успевать",cost:"HK$40–80",rec:true},{name:"惠康 Wellcome, 記利佐治街 25",note:"Обычный супермаркет в квартале Fashion Walk, круглосуточно: вода, снеки, лапша, хлеб и что-нибудь на завтрак в поезд. По базовому списку дешевле DONKI, готовой еды почти нет — это докупка в дорогу, а не ужин. Четыре минуты от отеля",cost:"HK$30–60"},{name:"文輝墨魚丸大王, 渣甸街 22–24",note:"Тот самый «последний гонконгский» ужин: кальмаровые шарики с рисовой лапшой (紫菜墨丸河), бульон из сушёной рыбы, хрустящая рыбья кожа. 8:00–02:00, зал простой, местные сидят семьями. Четыре минуты от отеля, миска ~HK$45–65 — закрывается в два ночи, можно не спешить",cost:"HK$45–65 с человека"},{name:"一蘭 Ichiran, 謝斐道 440",note:"Рамен в кабинках, без очередей и разговоров: 9:00–05:00, последний заказ в 4:30. ~HK$100 с человека, после 22:00 берут надбавку за позднее время. Десять минут пешком от отеля. Надёжно, но это Япония, а не Гонконг — на прощальный ужин слабее по смыслу",cost:"~HK$100"},{name:"華姐清湯腩, 電氣道 13A1",note:"Мишленовский Bib Gourmand четырнадцать лет подряд: прозрачный бульон, говяжья грудинка, рисовая лапша, ~HK$70–90. Семь минут от отеля, работает до 22:45 — успеваете только если вышли из парка не позже 21:00 и сразу в метро",cost:"HK$70–90"}]},
  {k:"wellcome_cwb", name:"Вечером: вода и еда в дорогу", tag:"shopping", note:"Перед ранним поездом 08:07 до Фужуна набрать воду, снеки и что-нибудь на завтрак: 惠康 Wellcome на 記利佐治街 25 работает круглосуточно, четыре минуты от отеля. Овощи и фрукты в дорогу брать не стоит — через границу нельзя, а вот воду, орехи, печенье и лапшу можно", cost:"HK$30–60"}
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

const HKF_TO_FURONG = {city:"fr", title:"Гонконг → Фужун", sub:"G6080 в 08:07 из Западного Коулуна, выезд из отеля в 06:45, в Фужуне около 14:15", places:[
  {k:"causeway_bay", name:"Такси из Causeway Bay в Западный Коулун", tag:"transport", note:"Выезд из отеля 06:45–07:00: 20–25 минут через туннель, ~HK$120–150. На вокзале за 40–50 минут до отправления — контроль и посадка спокойно; метро в такую рань с чемоданами смысла не имеет", cost:"~HK$130"},
  {k:"west_kowloon", name:"G6080: Западный Коулун → Фужунчжэнь", tag:"transport", note:"08:07 → около 14:15, 6 часов; единственный поезд в этом направлении — билеты за 14 дней", cost:"¥770"},
  {k:"furong", name:"«Городок на водопаде» днём", tag:"sight", note:"Сначала мостки под водопадом, потом чай на террасе; гостевой дом с видом на воду", cost:"¥100"},
  {k:"furong", name:"Подсветка водопада", tag:"sight", note:"Город открыт 08:00–24:00, но смысл в темноте: свет включают около 18:00 и держат до закрытия города (около полуночи), шоу подсветки на самом водопаде идёт около 19:30–21:30. В декабре воды меньше, чем на летних кадрах (максимум — июнь), но поток и подсветка остаются, и вечером это выглядит лучше, чем днём. Смотреть с площадки 花少 и с мостков у водопада", cost:"вход в город ¥100–108"},
  {k:"furong", name:"Трансфер со станции", tag:"transport", note:"Почти все гостевые дома у водопада забирают гостей со станции 芙蓉镇 бесплатно, но просить надо заранее — хотя бы за сутки до приезда, при брони. Иначе 10 минут на такси от станции, водители у выхода знают все «观瀑»-дома по названиям"},
  {k:"furong", title:"Отель с видом на водопад: варианты", tag:"hotel", picks:[
    {name:"悬园·观景庭院民宿 (芙蓉镇景区店)", rec:true, note:"Наш выбор. 9,8 из 10 по 3 087 отзывам (сервис 9,9, расположение 9,8) — выше 93% жилья в Юншуне. Стоит у самого входа в старое место: до 景区 1–2 минуты пешком, при этом такси подъезжает прямо к двери, и чемоданы не надо тянуть по каменным ступеням внутри городка. До водопада 580 м, до улицы 五里石板街 490 м, до парка туцзяских обычаев 350 м. Бесплатный трансфер со станции 芙蓉镇, при заезде чай и снеки, хозяева рассказывают город и помогают с билетами со скидкой, домашний завтрак, зелёный двор, бесплатное хранение багажа, парковка, чайная и кафе. Вид на ночной город — с террасы и из двора, водопад не из окна, а в пяти минутах. Цену за 10.12 сверить на Trip.com", cost:"цену сверить"},
    {name:"土司宣府 (大瀑布店)", note:"Если хочется спать буквально над водой: прямо напротив большого водопада, рядом с театром 翼南广场. Дом собран без гвоздей, в стиле туцзяской свайной постройки: во дворе сад со смотровой площадкой и раскрывающимся на 270° видом на водопад и реку 酉水, из номеров «临瀑花园» окна выходят прямо на воду, при доме ресторан с 湘西米线. Слышно воду всю ночь — ради этого и едут. Цену за 10.12 сверить на Trip.com", cost:"цену сверить"},
    {name:"土司驿栈 (大瀑布店), 芙蓉镇 45 号", note:"Проще и дешевле 宣府, но с тем же адресом у воды: 4,7 за расположение по отзывам, бесплатный трансфер со станции, ресторан, камера хранения. Хороший запасной вариант, если в 宣府 на наши даты не осталось номеров с видом", cost:"дешевле 宣府"},
    {name:"十二城·临瀑观景度假美宿 (大瀑布店)", note:"В самом центре старого города, номера-дуплексы в два уровня, из окон водопад и ночная подсветка; выходить смотреть шоу — минута пешком", cost:"цену сверить"}
  ]},
  {k:"furong", name:"Ужин: туцзяская кухня", tag:"food", note:"", cost:"¥60–90"},
]};

const FR_TO_ZJJ_MORNING = {city:"zjj", title:"Фужун → Чжанцзяцзе", sub:"23 минуты поездом, заселение в Улинъюане", places:[
  {k:"furong", name:"Утро у водопада, до групп", tag:"sight", note:"До 9:00 на мостках почти никого"},
  {k:"furong", name:"Поезд Фужунчжэнь → Чжанцзяцзе-Западный", tag:"transport", note:"23–30 минут, больше 12 поездов в день; от станции до Улинъюаня ещё 40 минут на автобусе или Didi", cost:"¥40"},
  {k:"zhangjiajie", name:"Заселение у восточных ворот", tag:"hotel", note:"Отель заранее бронировать в Улинъюане, не в городе Чжанцзяцзе: от вокзала до ворот парка 35 км, 40–50 минут. До 吴家峪门票站 пешком 10–15 минут. Это первые две ночи — Tangcourt в 吳家峪, 1,2 км до 標誌門; третью ночь 13→14.12 проводим в городе"},
  {k:"huanglong_cave", name:"Пещера Хуанлун (黄龙洞)", tag:"sight", note:"Главная причина ехать: с мая 2025 в пещере новая подсветка — натуральные каменные стены используют как огромный экран и проецируют историю «大鲵化龙», как исполинская саламандра превращается в дракона. Это постоянная экспозиция, а не сеанс по расписанию. Внутри 2–3 часа: 3,2 км пешком (800 м из них — на катере по подземной реке Сяншуй) и зал 龙宫 с 19-метровым «定海神针», который застрахован на ¥100 млн. От отеля 15 минут на Didi (~¥20) или 40 минут автобусом 1路 за ¥2 до ворот, от ворот до входа пешком 10 минут. Работает 08:00–17:30, последний вход уточнить на месте; катер включён в билет", cost:"¥100"},
  {k:"zhangjiajie", name:"Ручей Цзиньбяньси — запасной вариант", tag:"optional", note:"7,5 км по ровной долине у ручья — самая лёгкая тропа парка. Подходит вместо пещеры в день приезда, если поезд из Фужуна придёт поздно. С 01.12 низкий сезон: ¥147 вместо ¥225–239, билет на 4 дня с многократным входом; кассы обычные билеты не продают — только онлайн по таймслотам", cost:"¥147"},
  {k:"zhangjiajie", name:"Билеты в парк — купить сегодня на 12.12", tag:"optional", note:"Пропуск: <a href=\"https://trip.tpo.li/5omi77gs\" target=\"_blank\" rel=\"noopener\">парк на Trip.com</a> или мини-программа WeChat «张家界一机游» — обе продают по паспорту и таймслоту. Пропуск на 4 дня с многократным входом, поэтому при плохой погоде дни можно поменять местами. Отдельно: <a href=\"https://trip.tpo.li/937Lbk5y\" target=\"_blank\" rel=\"noopener\">лифт Байлун ¥65</a>, <a href=\"https://trip.tpo.li/mW6ZkHVH\" target=\"_blank\" rel=\"noopener\">канатка Тяньцзышаня ¥67–72</a>, <a href=\"https://trip.tpo.li/FqOcd1Mm\" target=\"_blank\" rel=\"noopener\">канатка Янцзяцзе ¥76</a>; комбо «3 канатки + лифт» — ¥193–238. Ссылки партнёрские: цену в них сверять с 一机游 на наши даты", cost:"¥147 + ¥193"},
  {k:"zhangjiajie", name:"Если поезд придёт позже 13:30", tag:"optional", note:"Пещеру тогда отменяем: 2–3 часа в неё не влезают, а 13.12 уже занят переездом в город и Тяньмэнем. Вместо неё 溪布街 рядом с отелем и ранний ужин — 12.12 вставать к открытию парка"},
  {k:"zhangjiajie", name:"Погода: пещера — план на туман", tag:"optional", note:"В декабре в горах облака стоят стеной и смотровые закрыты; в пещере видно всегда. Если на 12.12 обещают туман, меняем дни местами: пещера 12.12, парк 11.12 после заселения — пропуск всё равно на 4 дня с многократным входом"},
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
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"19:30, 75 минут, зал вращается на 360°; выходной у театра в понедельник, в воскресенье играют", cost:"¥279"},
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

const MAIN_HK_ARRIVE = {city:"hk", title:"Прилёт через Шэньчжэнь", sub:"11:40 в Шэньчжэне, метро и поезд через границу, в Causeway Bay к 15:00", places:[
  {k:"sz_airport", name:"Пересадка в Пудуне 2 ч 05", tag:"transport", note:"Терминал 1 → терминал 1 без выхода; багаж зарегистрирован до Шэньчжэня, на пересадке получать не надо"},
  {k:"sz_airport", name:"MU 5331: 9:00 Пудун → 11:40 Шэньчжэнь", tag:"transport", note:"2 ч 40, Airbus A330-200. В аэропорту Шэньчжэня метро линия 11 до Футяня — 40 минут, ¥10"},
  {k:"futian", name:"Футянь → Западный Коулун поездом", tag:"transport", note:"14–18 минут, ¥68–75, поезда с 06:35 до 22:31; паспортный контроль в самом вокзале — это первый въезд в материковый Китай, виза не нужна (безвиз РФ–КНР)"},
  {k:"causeway_bay", name:"Заселение: Rosedale Hotel, Causeway Bay — к 15:00", tag:"hotel", note:"Расчёт от посадки: 11:40 в Шэньчжэне, чемодан с ленты — 12:05–12:10; метро линия 11 до Футяня 35–40 минут, ¥10 — на вокзале к 13:00; билет, досмотр и посадка 20–25 минут (через 12306 продают не позже чем за 30 минут до отправления), поезд в 13:30 идёт 14–15 минут, ¥68–75; на Западном Коулуне оба контроля в одном здании — выход из материкового Китая и въезд в Гонконг, с паспортами 20–40 минут. От вокзала до Causeway Bay такси 20–25 минут через туннель, ~HK$120–150: в отеле к 14:45–15:15. Дешевле, но с двумя пересадками и чемоданом: Tuen Ma line до 紅磡 и автобус 102 или 106 через туннель до остановки 維多利亞公園, ещё 20 минут сверху. Заезд с 14:00, стойка круглосуточная: номер к приезду будет готов. До Central Harbourfront на фестиваль — Island line до 金鐘 и 10 минут пешком", cost:"такси ~HK$130"},
  {k:"victoria_park", name:"Виктория-парк и первый вечер", tag:"sight", note:"Парк начинается через дорогу от отеля — 3 минуты пешком, вход бесплатный, открыт круглосуточно. Девятнадцать гектаров: дорожки, газоны, вечером фонари и местные с собаками и на роликах. По краю парка стоят Central Library (66 Causeway Road: пн–вт и чт–вс 10:00–21:00, среда с 13:00, бесплатно — сюда прятаться от дождя) и храм Тинь Хау (10 Tin Hau Temple Road, 8:00–17:00, памятник с 1982 года). Храм к вечеру закрыт, поэтому его оставляем на свободное утро, а сегодня просто гуляем по парку и возвращаемся к ужину"},
  {k:"causeway_bay_food", title:"Ужин рядом с отелем: пять вариантов", tag:"food", note:"После ночи в самолёте никуда не едем: всё в пяти–десяти минутах пешком от Rosedale.",picks:[
    {name:"Tim Ho Wan 添好運, Causeway Bay", rec:true, note:"Тот самый димсам-бренд из мишленовского гида, но в филиале у отеля: Shop LG02-08, LG/F, Lee Garden Two, 28 Yun Ping Road, 9:30–21:30 ежедневно, четыре минуты от выхода F1 Causeway Bay. Брать 酥皮焗叉燒包 (печёные булочки с чашао), харгау и рисовый рулет с креветкой; на двоих с чаем выходит HK$90–120. Зал большой, в 18:00–19:00 бывает очередь минут на десять", cost:"HK$90–120 на двоих"},
    {name:"Genki Sushi 元気寿司, Causeway Bay", note:"Конвейер с поездом-доставкой ближе всех к отелю: Shop 203–204, 2/F, Windsor House, 311 Gloucester Road — пять минут пешком, вход со стороны парка. Работает с 11:30 до позднего вечера, HK$60–90 с человека. Вариант, если после перелёта хочется просто сесть и есть, не выбирая блюда", cost:"HK$60–90"},
    {name:"荳品廠 Yan Wo Dou Bun Chong, 渣甸街", note:"Соевая лавка старого Гонконга на Jardine's Bazaar: соевое молоко, тофу-пудинг 豆腐花, жареный тофу с креветкой. По OpenRice адрес 49 Jardine's Bazaar, в других источниках 55 — искать по вывеске 人和荳品廠, работает примерно до 22:00. Самое дешёвое и самое быстрое из пяти: HK$20–40 с человека, за столиком или на вынос", cost:"HK$20–40"},
    {name:"喜喜冰室 Cafe Match Box, Fashion Walk", note:"Чаа-чаан-тэн в стиле 1980-х: вывески, витрины, старые меню. 57 Paterson Street, Fashion Walk, 7:30–22:00 — семь минут пешком от отеля и ровно по пути к Fashion Walk. Брать 菠蘿油 (булочка с маслом), 沙嗲牛肉麵 и молочный чай", cost:"HK$50–80"},
    {name:"DON DON DONKI 驚安の殿堂, 名珠城", note:"Японский супермаркет на четыре этажа в том же квартале: 1/F–4/F, Pearl City, 22–36 Paterson Street, работает круглосуточно. Готовые бэнто, суши-сеты, онигири, десерты — берём на вынос и едим в номере, если после перелёта никого не хочется видеть. Там же вода и снеки на утро", cost:"HK$40–80"}
]},
  {k:"mammy_pancake", name:"Десерт: 媽咪雞蛋仔 Mammy Pancake, 渣甸街 36", tag:"food", note:"Гонконгские вафли из 雞蛋仔: хрустящая корочка и мягкая середина. Нужная точка — 渣甸街 36, 12:00–23:00, семь минут от отеля и в двух шагах от Yan Wo; брать классические, с таро или с солёным желтком, ~HK$25–40 за порцию. Вторая точка — 廟街 219 в Джордане, у Temple Street. Шесть лет подряд в мишленовском гиде уличной еды", cost:"HK$25–40"},
  {k:"fashion_walk", name:"Если останутся силы: Fashion Walk", tag:"shopping", note:"Пять–семь минут пешком от отеля, квартал между Paterson, Kingston и Cleveland Street: витрины с 20.11 в рождественских огнях, кофейни, DON DON DONKI (круглосуточно) и супермаркет Wellcome на Kingston Street — заодно купить воду и что-нибудь на завтрак. Предложение, не обязательный пункт: если после перелёта идти уже не хочется, оставляем на 8.12 и возвращаемся в отель сразу после ужина"}
]};

const MAIN_CQ_OLD = {city:"cq", title:"Храм архатов, галерея и театр", sub:"Центр 渝中 пешком, шопинг и паром, вечером шоу «1949»", places:[
  {k:"luohan_temple", name:"Храм архатов (罗汉寺)", tag:"sight", note:"8:00–17:00, метро 小什字: 524 архата и сунские рельефы на 古佛岩. Вход даёт три палочки и свечу; рядом, в S95超维中心, кофейня 瓦顶顶 с видом на черепицу храма и башни за ней", cost:"¥20"},
  {k:"art_gallery_cq", name:"Chongqing Art Gallery", tag:"sight", note:"10:00–18:00, вход бесплатный; закрыто по понедельникам — в другие дни работает"},
  {k:"jiefangbei", title:"Обед в 渝中: пять вариантов", tag:"food", picks:[
    {name:"八一好吃街", rec:true, note:"Уличная еда в двух шагах от 解放碑: сяомянь, чаошоу, шашлычки, сладкие шарики — ¥15–25 за порцию, выбираешь глазами. Минус — к 13:00 толпа и всё на ногах, сесть негде", cost:"¥15–25"},
    {name:"花市豌杂面, 民生路 85", note:"Та самая лапша с горохом и мясным соусом из всех подборок: 民生路 85, от 临江门 выход 3 около 280 м, 7:00–20:00, ¥15–20, зал простой и быстрый. Брать 豌杂面, не 小面 — разница именно в горохе", cost:"¥15–20"},
    {name:"鬼包子, 八一路 238", note:"松针垫底 на пару, оттого хвойный запах: 八一广场 1F, L113-3, работает 7:00–01:00, ~¥15–25 за порцию. Очередь на улице почти всегда, но двигается быстро; рядом их же 鬼酥肉", cost:"¥15–25"},
    {name:"瓦顶顶 (WǎDǐngDǐng), 五一街 95", note:"Кофейня на 5-м этаже S95超维中心, прямо у 罗汉寺: из окна черепица храма вплотную и башни за ней — тот кадр, где древность и небоскрёбы в одном стекле. Кофе с местной сычуаньской ноткой, есть десерты", cost:"~¥35–50"},
    {name:"茶颜悦色, 解放碑", note:"Сетевая чайная из Чанша, в Чунцине с 2022 года: фирменный 幽兰拿铁 и пенка, а в магазинах типа 茶叶子铺 продают чай на развес — хороший сувенир вместо магнита. Точки в 解放碑 и 观音桥, вечером очередь меньше", cost:"~¥20 за стакан"}
  ]},
  {k:"jiefangbei", name:"Шопинг на 解放碑步行街 (опция)", tag:"shopping", note:"Молы вокруг площади работают 10:00–22:00: 英利国际, 大都会东方广场, 八一广场, 时代广场 — одежда, кроссовки, косметика, электроника. Крупное и тяжёлое лучше не брать здесь: чемоданы поедут через Шанхай, а возврат НДС в аэропорту требует, чтобы вещи были в ручной клади. 重庆IFS стоит в 江北嘴, а не на 解放碑 — не путать", cost:"по вкусу"},
  {k:"ciqikou", name:"Цикоу", tag:"sight", note:"Бесплатно; к вечеру толпа мягче, до театра пешком"},
  {k:"ciqikou", name:"Post Coffee (邮局咖啡) в Цикоу", tag:"food", note:"Кофейня-почта в старом городе: открытки, марки и ящик, откуда можно отправить себе весточку домой — до Воронежа идёт 3–5 недель. Кофе обычный, смысл в ритуале и в том, что открытка придёт уже после поездки. Часы как у улицы, вечером закрывается раньше лавок", cost:"~¥30"},
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"19:30, 75 минут, зал вращается на 360°; выходной у театра по понедельникам", cost:"¥279"},
  {k:"jiefangbei", title:"После шоу: четыре варианта", tag:"sight", picks:[
    {name:"Паром 两江游 в подсветке", rec:true, note:"К 21:00 из театра 10–15 минут на такси до пристаней у 朝天门: последние вечерние рейсы уходят примерно до 21:30, 60–70 минут по обеим рекам. В темноте это лучший вид города, который можно получить, не поднимаясь ни на одну смотровую", cost:"~¥100–150"},
    {name:"得意世界, 较场口", note:"Квартал неоновых фасадов, где днём едят, а ночью снимают: в одном комплексе 得意潮馆 и 得意美食城 — хотпоты, 蹄花, кантонская кухня, лапша, всё до полуночи и позже, часть точек круглосуточно. Подсветку включают к 19:00", cost:"¥40–80"},
    {name:"地下之城·防空洞老火锅", note:"Хотпот в бывшем бомбоубежище завода: 两江新区, 吉安路临 5, у южных ворот парка 龙头寺, ближайшее метро 红土地. Тоннель 520 м, 218 столов, внутри круглый год ~25 °C, работает круглосуточно, ~¥80 с человека. Брони нет — в 18:00–20:00 очередь, после 21:00 садятся сразу", cost:"~¥80"},
    {name:"Хунъядун на ночь", note:"Если после театра хочется просто дойти до подсветки: 10 минут пешком, огни до 23:00, к 22:00 людей заметно меньше. Внизу на 嘉滨路 — набережная и вид на 千厮门 мост"}
  ]},
]};

const MAIN_CQ_ARRIVE_JB = {city:"cq", title:"Чжанцзяцзе → Чунцин: Цзянбэй", sub:"Поезд после обеда, база в 渝中 или на 时代天街, вечером паром, Хунъядун или парк на том берегу", places:[
  {k:"zhangjiajie", name:"Поезд Чжанцзяцзе-Западный → Чунцин-Восточный", tag:"transport", note:"Выезжать с городского отеля: до 張家界西 5,3 км — 10–15 минут; поездов больше 20 в день, в пути 2 ч 30 – 3 ч 15. Брать дневной, чтобы в Чунцине остался вечер", cost:"¥197–273"},
  {k:"jiefangbei", title:"Отель на четыре ночи: четыре варианта", tag:"hotel", picks:[
    {name:"The Move River View Hotel, 渝中", rec:true, note:"邹容路50号, 半岛国际商务大厦 20-й этаж: до 解放碑 260 м, до 洪崖洞 950 м, до метро 小什字 370 м, до 较场口 660 м. Часть номеров с окнами на реку, стойка круглосуточно, заезд с 14:00, выезд до 12:00. Из всех вариантов это единственный, где 渝中-день начинается пешком, а не с метро; цену за 14–18.12 сверить на Trip.com — в декабре она ходит за неделю", cost:"цену сверить"},
    {name:"Цисинган (七星岗), линия 1", note:"Старая база плана: 汉庭, SFEEL设计师酒店, Wells — ¥250–400 за ночь. До 解放碑 10–15 минут пешком, рядом 较场口 и 十八梯, но вид из окна — город, не река", cost:"¥250–400"},
    {name:"龙湖时代天街 (Дапин), линия 1 и 2", note:"Огромный молл с едой на любой вкус и пересадка двух линий, новые отели дешевле. Минус тот же, что и был: до набережной и 渝中 25–30 минут на метро, на четыре ночи это набегает", cost:"дешевле центра"},
    {name:"BLACK в 下浩 — не нашла", note:"Из этой идеи отеля BLACK в 下浩 я не подтвердила: в квартале стоят 浩望角HOTEL, SU HOTEL 苏适 и 满园宋民宿, все новые, с видом на 渝中 и в 5 минутах от 上新街. Брать их стоит, только если хочется жить на южном берегу: тогда каждый вечер 15–20 минут через мост до центра, зато из окна весь 渝中 в подсветке", dim:"вариант под жильё на южном берегу"}
  ]},
  {k:"hongya_cave", title:"Вечер первого дня: три варианта", tag:"sight", picks:[
    {name:"Парк Цзянтань (江北嘴江滩公园)", rec:true, note:"Линия 6 до 大剧院, выход 2, дальше 800 м пешком вдоль реки. Хунъядун виден целиком с другого берега Цзялина — ровно, без ступенек. Подсветка с 18:00 до 23:00; в сухой сезон у воды обнажается отмель. Ветер с воды холодный — шапка не лишняя"},
    {name:"Прогулка на пароме 两江游 по двум рекам", note:"Пристани у 朝天门 и 洪崖洞, вечерние рейсы примерно с 19:00 до 21:30, 60–70 минут: идут по Цзялину до моста 千厮门 и обратно по Янцзы под 东水门. Билет на пристани или на Trip.com, есть открытая палуба и закрытый салон — в декабре берите салон с выходом на палубу. После поезда и переезда это ровно тот формат, где ничего не надо решать", cost:"~¥100–150"},
    {name:"Хунъядун вплотную", note:"Если хочется не смотреть на подсветку с берега, а стоять внутри: 11 этажей на склоне, снизу вверх на эскалаторах, подсветку включают к 18:30, к 20:00 идти уже тесно. Рядом 千厮门 мост — оттуда самый известный кадр"}
  ]},
  {k:"nanbinlu", title:"Ужин первого вечера: четыре варианта", tag:"food", picks:[
    {name:"十八梯眼镜面, 五里店", rec:true, note:"Если после поезда не хочется никуда ехать: у 大剧院, в 五里店 — лапша и вонтоны с 1988 года, ~¥30 с человека, никакой очереди. Совсем по-местному — квартал 野水沟 за 观音桥: рынок и забегаловки, где обедают за ¥10–20, но это другой конец Цзянбэя", cost:"¥10–30"},
    {name:"黄玉明烤肉, 龙门浩", note:"Мангал на склоне над Янцзы, первый в чунцинском рейтинге барбекю:贵州黑山猪肉, маринованная баранина, живая музыка, ~¥127. Закат и включение подсветки — 17:00–19:00, машина доходит только до подножия, дальше 10 минут вверх пешком. После поезда — только если есть силы", cost:"~¥127"},
    {name:"桃园火锅, 南滨路", note:"Хотпот на склоне у 南滨路 с видом на 渝中 и живой музыкой: тот же жанр, что 黄玉明, но с котлом. Вечером бронь или очередь, просить стол у края террасы", cost:"~¥100–130"},
    {name:"张三的烤肉, 南滨路 113", note:"Тот самый ресторан из видео с дрон-шоу. Честно про шоу: оно идёт по субботам в 20:30 (зимний сезон), а в Чунцине вы с понедельника по пятницу — в этот заезд шоу не увидеть. Без шоу остаются мангал, живая музыка и вид, ~¥129; трёхместный сет в отзывах ¥399", cost:"~¥129"}
  ]},
]};

const MAIN_CQ_NANAN = {city:"cq", title:"Наньань: Сяхаоли, Хуанцзюэя и Лаоцзюньдун", sub:"Южный берег и гора Наньшань: старые улицы, чайные и ужин над рекой", places:[
  {k:"kuixinglou", name:"Куйсинлоу", tag:"sight", note:"Бесплатно, 8:00–22:00: первый этаж на набережной Цзялин, а 22-й — на уровне улицы, поднимаешься лифтом. Двадцать минут по пути к метро"},
  {k:"raffles_city", title:"Подняться над рекой: три варианта", tag:"sight", picks:[
    {name:"Raffles City: обзор 探索舱, 250 м", rec:true, note:"10:00–22:00, последние билеты в 21:00; идём к открытию — в 10:00 очередей нет. Скайуок 云中漫步 по гребню 水晶连廊 — отдельный билет, при ветре закрывают", cost:"¥120"},
    {name:"云端之眼 (Cloud Eye), 67-й этаж", note:"新华路 201, 联合国际: 09:30–23:00, вход до 22:30, ¥68 с человека, двойной ¥126. Две площадки — 67-й этаж в стекле и 69-й под открытым небом; после 19:00 на красной лестнице лимит 30 секунд на человека, приходить до 19:00. Метро 小什字, выход 5A", cost:"¥68"},
    {name:"苏家坝立交: площадка 铜元之光", note:"Южный берег, метро 铜元局: лестница и эскалаторы на смотровую площадку над 苏家坝立交 (72 м, спиральные съезды) — 270° на реку, 菜园坝 мост и 渝中. Бесплатно, работает круглосуточно. Проехать по самому立交 на автобусе тоже можно: 318 и 873 идут по эстакаде мимо 苏家坝 — садиться у 菜园坝 и выходить на 苏家坝", cost:"бесплатно"},
    {name:"Канатка через Янцзы (长江索道)", note:"Южная станция 上新街 — в пяти минутах от Сяхаоли, так что это не отдельная поездка, а способ перебраться в 渝中. Зимой 8:00–21:00, ¥30 в одну сторону, ¥50 туда-обратно, кабина идёт 4–5 минут. В вечернем окне 19:00–20:00 очередь до получаса", cost:"¥30 / ¥50"}
  ]},
  {k:"nanbinlu", title:"Старые улицы южного берега", tag:"sight", picks:[
    {name:"Сяхаоли (下浩里)", rec:true, note:"От 小什字 две остановки линией 6 под Янцзы до 上新街, дальше 10 минут пешком вверх. Каменные переулки террасами над водой, книжные, кофейни, вид на 东水门 мост. Открыто круглосуточно, бесплатно; в воскресенье днём людно, к вечеру свободнее"},
    {name:"龙门浩老街", note:"Соседний с Сяхаоли квартал — 南滨路 105, бесплатно, открыт круглосуточно. Двадцать с лишним памятников: бывшие консульства, 法国永兴洋行, 武昌中华大学, дома с бельведером. С площадки у воды 渝中 как на ладони; сюда же приходят к 17:00, чтобы поймать закат и подсветку", dim:"тот же берег, 5–10 минут пешком от Сяхаоли"}
  ]},
  {k:"huangjueya", name:"Хуанцзюэя (黄桷垭老街)", tag:"sight", note:"Бесплатно, открыто круглосуточно. От 上新街 автобус 346 до 黄桷垭 или 10 минут на Didi вверх по горе. Каменная улица на склоне, дом-музей писательницы Саньмао, начало тропы 黄葛古道 с огромными хуанге. Вниз по ступеням не спускаться — обратно тем же такси"},
  {k:"huangjueya", name:"Лаоцзюньдун (老君洞)", tag:"sight", note:"Даосский храм на склоне Наньшаня: 8:00–17:00, вход до 16:30, бесплатно, на входе дают три палочки благовоний. С верхней площадки 玉皇顶 — панорама всего полуострова 渝中. Заходить лучше с западных ворот 西门: сразу 三清殿, а не лестница ради лестницы; подъём в гору, в декабре с утра влажно — идти не спеша", cost:""},
  {k:"nanbinlu", title:"Кофе и чай на южном берегу: четыре варианта", tag:"food", picks:[
    {name:"SoSo House, 下浩里 33B", rec:true, note:"Кофейня-бистро в самом Сяхаоли: кофе, вино, простые завтраки и десерты, окна в зелень и на воду. Пятая строчка в списке 南滨路 по кофе, зал небольшой — днём свободнее, вечером нужна бронь", cost:"~¥40–70"},
    {name:"熹玥盒子 (Xiyue Hezi), Сяхао", note:"Дяньча — взбитый сунский чай, десерт-бабочка, тот самый стол. Зал маленький, один общий стол и лимит времени, хватает 1–1,5 часа. Скорее про картинку, чем про чай — порции небольшие, ценник выше среднего"},
    {name:"苔 moss, 下浩里 3-1", note:"Японская десертная в глубине Сяхаоли: матча, хвойные вкусы, тихий двор. Работает примерно 11:30–21:00, мест мало — заходить сразу после обеда, а не к вечеру", cost:"~¥40–60"},
    {name:"茶室 в 下浩 (xiabo teahouse)", note:"Название я записала с ваших слов, точку по нему подтвердить не смогла: в квартале несколько чайных — 惜月盒子, 舍今书院 и чайные при галереях. Если помните, как выглядела дверь или что наливали, найду адрес; иначе спрашивать на месте по вывеске 茶馆", dim:"уточнить на месте"}
  ]},
  {k:"nanbinlu", title:"Ужин с видом на город: четыре варианта", tag:"food", picks:[
    {name:"黄玉明烤肉, 龙门浩", rec:true, note:"Мангал на склоне над Янцзы, 龙门浩街道 一天门街 102 号附 1 (у 长丰汽修厂 поворот и 188 м вверх). Работает 12:00–24:00, ~¥127: 贵州黑山猪肉, маринованная баранина, тонко нарезанная говядина, живая музыка с 19:00. Лучшее время 17:00–19:00 — закат и включение подсветки одним заходом. Машина доходит до подножия, дальше 10 минут вверх; столик у края бронировать заранее", cost:"~¥127"},
    {name:"张三的烤肉, 南滨路 113", note:"Второй мангал с видом, ~¥129, живая музыка, сеты на двоих и троих. Дрон-шоу над рекой идёт только по субботам (зимой в 20:30) — в этот заезд его не будет, поэтому сюда стоит идти ради еды и вида, а не ради шоу. В отзывах советуют занимать стол к 20:00", cost:"~¥129"},
    {name:"桃园火锅, 南滨路", note:"Хотпот над рекой с живой музыкой: 南滨路, терраса со стороны воды. Тот же жанр, что два мангала, но с котлом; просить стол на краю террасы, вечером бронь", cost:"~¥100–130"},
    {name:"罗地摊, 涂山路 583", note:"Семейная закусочная в 弹子石, 10 минут на Didi от 下浩 вдоль берега: 盐煎肉, 肝腰合炒, порции огромные — три блюда на троих уносят с собой. Работает 11:00–14:30 и 17:00–20:00, то есть это ранний ужин, а не ночной", cost:"~¥40–60"}
  ]},
]};

const MAIN_CQ_TO_SH = {city:"sh", title:"Чунцин → Шанхай: 20 часов у Пудуна", sub:"13:15 из Цзянбэя, 15:45 Пудун — баня, отель или вечер шопинга в центре", places:[
  {k:"chongqing", name:"Выезд из отеля к 10:00", tag:"transport", note:"До Цзянбэя 30–40 минут такси; утром только завтрак и сборы — город в этот день уже не смотрим"},
  {k:"chongqing", name:"MU 5430: 13:15 CKG → 15:45 Пудун", tag:"transport", note:"2 ч 30, China Eastern, Airbus A321, терминал 3 → терминал 1; билет один с обратным плечом, багаж зарегистрирован до Шереметьева"},
  {k:"jile_tang_chuansha", title:"Баня у Пудуна: три варианта", tag:"spa", note:"Двадцать часов стыковки: ночь в бане дешевле отеля.",picks:[{name:"极乐汤川沙 (Gokurakuyu)",note:"Главный вариант на 20-часовую стыковку. Японский комплекс 15 000 м² в Чуаньше, 15–20 минут на такси от терминала 1: семь видов ванн, 6–7 каменных саун (岩盘浴), татами-зона, ресторан, комнаты отдыха. Вход ¥158 (по клубной карте ¥118), комплекс работает круглосуточно, но с 02:00 до 05:00 берут ночной тариф +¥50 с человека; паспорт на ресепшене, купальник не нужен — отделения раздельные. При комплексе есть отель 极乐汤川沙温泉酒店 (номера от ~¥299 по акциям): можно взять номер и спать в кровати, а не в общем зале. План: 15:45 посадка, 16:45 на месте, ванны и ужин, сон, выезд в 07:45 — в терминале к 08:15, регистрация MU591 в 09:30",cost:"¥158 вход + ¥50 ночью",rec:true},{name:"极乐汤碧云, ближе к центру",note:"Второй филиал той же сети, 新金桥路 600 в Пудуне, 35–40 минут от терминала. Вход ¥158 (по карте ¥118), те же японские ванны и каменные сауны, но работает до 02:00 — для ночёвки под утренний рейс хуже, зато по пути, если захочется заехать в город",cost:"¥158 / ¥118"},{name:"汤连得, дёшево и круглосуточно",note:"Простой районный комплекс на 长清路 1200 (Пудун), работает 24/7, вход ¥90–150 по акциям в приложении. Купальни, сауны, лежаки, буфет за отдельные деньги. Трансфера нет, 35–40 минут на такси; звёзд с неба не хватает, но переночевать между ваннами можно",cost:"¥90–150"}]},
  {k:"shanghai", name:"Запасной вариант: отель у Пудуна", tag:"hotel", note:"Если бани не зайдут или захочется просто выспаться: ночлег рядом с терминалом 1, 3–4 тыс. ₽ за номер; на ночь берём ручную кладь и смену белья, чемодан летит транзитом. Бронировать заранее — в декабре рядом с аэропортом разбирают быстро", cost:"~3 500 ₽"},
  {k:"shanghai", name:"Альтернатива: вечер шопинга в центре вместо бани", tag:"shopping", note:"Необязательный сценарий на ту же стыковку. Полного дня в городе из неё не выходит: посадка 15:45, линия 2 от терминала 1 до 南京东路 идёт 59 минут (¥7, пересадка кросс-платформенная на 广兰路), в городе к 17:30. Магазины закрываются в 22:00 — на шопинг 4–4,5 часа. Утром 19.12 магазины открываются в 10:00, а в терминале надо быть к 09:30, так что утро на покупки не работает вовсе. Отель в центре стоит примерно как аэропортовый (3–4 тыс. ₽), то есть смета не меняется, только строка «ночь у Пудуна» переезжает в город; чемодан летит транзитом, на руках ручная кладь. Покупки от ¥200 в одном магазине за день дают возврат НДС в аэропорту перед вылетом", cost:"~3 500 ₽"},
  {k:"nanjing_road", name:"南京东路: пешеходная улица и универмаги", tag:"shopping", note:"От станции метро 南京东路 сразу на улицу: 第一百货, 新世界城, 永安百货 и десятки магазинов по обе стороны, витрины и подсветка работают весь вечер. Магазины 10:00–22:00, рестораны на верхних этажах — до 22:00–23:00, ужин успеваем после покупок. Отсюда до 豫园 15–20 минут пешком", cost:""},
  {k:"yuyuan", name:"豫园商城: сувениры и вечерняя подсветка", tag:"shopping", note:"Лавки базара работают примерно до 21:00, подсветку включают к 19:00 — вечером это самый красивый шопинг в городе. Сам сад не влезает: 09:00–16:30, вход до 16:00, по понедельникам выходной, в декабре ¥30 — при приезде в 17:30 он уже закрыт, идём по базару и мосту 九曲桥", cost:""},
  {k:"bund", name:"Бунд в подсветке после шопинга", tag:"sight", note:"От 南京东路 до набережной 10–15 минут пешком, подсветку включают к 18:30: замыкаем вечер Бундом и видом на Пудун, ужин здесь же", cost:""}
]};

const MAIN_SH_HOME = {city:"sh", title:"Шанхай → Москва", sub:"11:50 из Пудуна, Шереметьево в 17:05, поезд 126 в 00:46, дома 20.12 днём", places:[
  {k:"shanghai", name:"Возврат НДС на покупки (если шопинг был)", tag:"shopping", note:"Стойка tax free в терминале 1 — до регистрации: сначала таможня смотрит неиспользованные товары и чек, потом сдаём багаж. Условия: от ¥200 в одном магазине за день, вылет в течение 90 суток, ставка 11 % (на руки обычно ~9 %), наличными до ¥20 000. Стойки работают с утра, товары держать в ручной клади", cost:""},
  {k:"shanghai", name:"MU 591: 11:50 Пудун → 17:05 Шереметьево", tag:"transport", note:"10 ч 15, Airbus A330-300, терминал 1 → терминал C; в аэропорту быть к 9:30, из отеля выезжать в 8:45"},
  {k:"hongkong", name:"Аэроэкспресс до Белорусского, дальше на Казанский", tag:"transport", note:"Аэроэкспресс около 50 минут после посадки в 17:05, с Белорусского на Казанский — одна ветка кольцевой, 10 минут. До поезда почти 6 часов: успеваем поужинать, а не ночевать в Москве"},
  {k:"hongkong", name:"Поезд 126: Казанский 00:46 → Придача 11:13", tag:"transport", note:"Билеты куплены, 4 673,80 ₽ за двоих. Вагон 12, плацкарт, место 15 (нижнее); отправление 20.12 в 00:46 — то есть уезжаем из Москвы ночью сразу после прилёта, 10 ч 27 в пути. Дома 20.12 в 11:13: воскресенье на отдых, на работу в понедельник 21.12", cost:"4 673,80 ₽ за двоих"},
]};

/* ==================== ВАРИАНТ 2: ГОНКОНГ + ДЕНЬ ВМЕСТО УЛУНА ==================== */

const ALT_HK_EXTRA = {city:"hk", title:"Макао или Большой Будда — на выбор", sub:"Шестая ночь в Гонконге: день на Макао или на Лантау вместо Улуна, аутлет у канатки", places:[
  {k:"macau", name:"Вариант А · паром в Макао", tag:"transport", note:"Из 上環 (Shun Tak Centre, Hong Kong–Macau Ferry Terminal) 55–60 минут, HK$175–200 в одну сторону, рейсы каждые 15–30 минут с 07:00. Выезжать в 8:30, чтобы к 10:00 быть в старом городе. Паспорт с собой: Макао — отдельная граница, россиянам 30 дней без визы. Билет брать сразу туда-обратно: на вечерние рейсы места кончаются", cost:"HK$350–400 туда-обратно"},
  {k:"senado_square", name:"Вариант А · Сенадо-сквер и руины Св. Павла", tag:"sight", note:"議事亭前地 с португальской плиткой, собор и 大三巴牌坊 — всё пешком в радиусе 10 минут. Дальше обед в 氹仔 и Венетка, если хочется каналов под крышей; обратный паром с 18:00, в Гонконге к 20:00"},
  {k:"ngong_ping", name:"Вариант Б · канатка Ngong Ping 360", tag:"sight", note:"Из 東涌 (метро Tung Chung, линия Tung Chung) 25 минут над заливом и аэропортом; будни 10:00–18:00, выходные 9:00–18:30, стандартная кабинка туда-обратно HK$295. К 9:30 очередь 5–10 минут, к полудню — час: быть к открытию", cost:"HK$295"},
  {k:"tian_tan_buddha", name:"Вариант Б · Большой Будда и монастырь По Линь", tag:"sight", note:"268 ступеней к статуе, вход бесплатный, 10:00–17:30; монастырь 9:00–18:00, вегетарианский обед 11:30–16:30. Наверху ветрено и на 3–4 градуса холоднее города — куртка не лишняя"},
  {k:"tai_o", name:"Вариант Б · деревня Tai O", tag:"sight", note:"Автобус 21 от Нгон Пин 15 минут: свайные дома над водой, лодки между домами, сушёная рыба и креветочная паста. Полтора-два часа и обратно тем же автобусом, к 17:00 в 東涌"},
  {k:"ngong_ping", name:"Вариант Б · Citygate Outlets 東薈城", tag:"shopping", note:"Аутлет стоит у нижней станции канатки в 東涌: Citygate Outlets, 18–20 Tat Tung Road, 5 минут от метро Tung Chung (выход C) — 150+ брендов, скидки круглый год 30–70 %, молл 10:00–22:00, но часть магазинов открывается в 11:00 и закрывается в 21:00. По логистике он бесплатный: с Tai O вы всё равно возвращаетесь в 東涌 к 17:00, отсюда два-три часа на обувь, сумки, спорт и часы, ужин на верхнем этаже (40+ заведений) и метро до Джордана ~45 минут с пересадкой в 荔景. Тяжёлое отсюда не тащить: впереди поезд 11.12 и три дня гор, поэтому обувь и куртки — да, крупная техника и посуда — нет. Возврат НДС здесь не работает, он только в Китае при вылете, но налога с продаж в Гонконге нет вовсе, так что полочная цена уже конечная.", cost:"скидки 30–70 %"},
]};

const ALT_CQ_OLD = {city:"cq", title:"Храм архатов, галерея и театр", sub:"Центр 渝中 пешком, шопинг и паром, вечером шоу «1949»", places:[
  {k:"luohan_temple", name:"Храм архатов (罗汉寺)", tag:"sight", note:"8:00–17:00, метро 小什字: 524 архата и сунские рельефы на 古佛岩. Вход даёт три палочки и свечу; рядом, в S95超维中心, кофейня 瓦顶顶 с видом на черепицу храма и башни за ней", cost:"¥20"},
  {k:"art_gallery_cq", name:"Chongqing Art Gallery", tag:"sight", note:"10:00–18:00, вход бесплатный; закрыто по понедельникам — в этот день недели работает"},
  {k:"jiefangbei", title:"Обед в 渝中: пять вариантов", tag:"food", picks:[
    {name:"八一好吃街", rec:true, note:"Уличная еда в двух шагах от 解放碑: сяомянь, чаошоу, шашлычки, сладкие шарики — ¥15–25 за порцию, выбираешь глазами. Минус — к 13:00 толпа и всё на ногах, сесть негде", cost:"¥15–25"},
    {name:"花市豌杂面, 民生路 85", note:"Та самая лапша с горохом и мясным соусом из всех подборок: 民生路 85, от 临江门 выход 3 около 280 м, 7:00–20:00, ¥15–20, зал простой и быстрый. Брать 豌杂面, не 小面 — разница именно в горохе", cost:"¥15–20"},
    {name:"鬼包子, 八一路 238", note:"松针垫底 на пару, оттого хвойный запах: 八一广场 1F, L113-3, работает 7:00–01:00, ~¥15–25 за порцию. Очередь на улице почти всегда, но двигается быстро; рядом их же 鬼酥肉", cost:"¥15–25"},
    {name:"瓦顶顶 (WǎDǐngDǐng), 五一街 95", note:"Кофейня на 5-м этаже S95超维中心, прямо у 罗汉寺: из окна черепица храма вплотную и башни за ней — тот кадр, где древность и небоскрёбы в одном стекле. Кофе с местной сычуаньской ноткой, есть десерты", cost:"~¥35–50"},
    {name:"茶颜悦色, 解放碑", note:"Сетевая чайная из Чанша, в Чунцине с 2022 года: фирменный 幽兰拿铁 и пенка, а в магазинах типа 茶叶子铺 продают чай на развес — хороший сувенир вместо магнита. Точки в 解放碑 и 观音桥, вечером очередь меньше", cost:"~¥20 за стакан"}
  ]},
  {k:"jiefangbei", name:"Шопинг на 解放碑步行街 (опция)", tag:"shopping", note:"Молы вокруг площади работают 10:00–22:00: 英利国际, 大都会东方广场, 八一广场, 时代广场 — одежда, кроссовки, косметика, электроника. Крупное и тяжёлое лучше не брать здесь: чемоданы поедут через Шанхай, а возврат НДС в аэропорту требует, чтобы вещи были в ручной клади. 重庆IFS стоит в 江北嘴, а не на 解放碑 — не путать", cost:"по вкусу"},
  {k:"ciqikou", name:"Цикоу", tag:"sight", note:"Бесплатно; к вечеру толпа мягче, до театра пешком"},
  {k:"ciqikou", name:"Post Coffee (邮局咖啡) в Цикоу", tag:"food", note:"Кофейня-почта в старом городе: открытки, марки и ящик, откуда можно отправить себе весточку домой — до Воронежа идёт 3–5 недель. Кофе обычный, смысл в ритуале и в том, что открытка придёт уже после поездки. Часы как у улицы, вечером закрывается раньше лавок", cost:"~¥30"},
  {k:"chongqing", name:"Шоу 《重庆·1949》, секция B", tag:"sight", note:"19:30, 75 минут, зал вращается на 360°; выходной у театра по понедельникам", cost:"¥279"},
  {k:"jiefangbei", title:"После шоу: четыре варианта", tag:"sight", picks:[
    {name:"Паром 两江游 в подсветке", rec:true, note:"К 21:00 из театра 10–15 минут на такси до пристаней у 朝天门: последние вечерние рейсы уходят примерно до 21:30, 60–70 минут по обеим рекам. В темноте это лучший вид города, который можно получить, не поднимаясь ни на одну смотровую", cost:"~¥100–150"},
    {name:"得意世界, 较场口", note:"Квартал неоновых фасадов, где днём едят, а ночью снимают: в одном комплексе 得意潮馆 и 得意美食城 — хотпоты, 蹄花, кантонская кухня, лапша, всё до полуночи и позже, часть точек круглосуточно. Подсветку включают к 19:00", cost:"¥40–80"},
    {name:"地下之城·防空洞老火锅", note:"Хотпот в бывшем бомбоубежище завода: 两江新区, 吉安路临 5, у южных ворот парка 龙头寺, ближайшее метро 红土地. Тоннель 520 м, 218 столов, внутри круглый год ~25 °C, работает круглосуточно, ~¥80 с человека. Брони нет — в 18:00–20:00 очередь, после 21:00 садятся сразу", cost:"~¥80"},
    {name:"Хунъядун на ночь", note:"Если после театра хочется просто дойти до подсветки: 10 минут пешком, огни до 23:00, к 22:00 людей заметно меньше. Внизу на 嘉滨路 — набережная и вид на 千厮门 мост"}
  ]},
]};

const VARIANTS = [
  {
    id:"hk-first", title:"Гонконг → Фужун → Чжанцзяцзе → Чунцин", photo:"Hong Kong", main:true,
    dates:["04.12 · пт","05.12 · сб","06.12 · вс","07.12 · пн","08.12 · вт","09.12 · ср","10.12 · чт",
           "11.12 · пт","12.12 · сб","13.12 · вс","14.12 · пн","15.12 · вт","16.12 · ср","17.12 · чт",
           "18.12 · пт","19.12 · сб"],
    china:[MAIN_FLIGHT_OUT, MAIN_HK_ARRIVE, V3_HK_FEST, V3_HK_CENTRAL, V3_HK_KOWLOON, V3_HK_DISNEY,
           HKF_TO_FURONG, FR_TO_ZJJ_MORNING, V3_ZJJ_AVATAR_TIANZI, V3_ZJJ_TIANMEN, MAIN_CQ_ARRIVE_JB,
           MAIN_CQ_OLD, V3_CQ_WULONG, MAIN_CQ_NANAN, MAIN_CQ_TO_SH, MAIN_SH_HOME],
    hk:[],
    cities:["в пути 1 ночь","Шэньчжэнь → Гонконг 5 ночей","Фужун 1","Улинъюань 2 + город 1","Чунцин 4","Шанхай 1"],
    summary:"Основной маршрут по купленным билетам, 4–19.12.2026, 14 ночей на месте плюс ночь в самолёте: 4.12 в 16:45 из Шереметьева MU248 через Шанхай (ночь в пути), 5.12 в 11:40 Шэньчжэнь, метро и поезд через границу — в Causeway Bay к 15:00, пять ночей в Rosedale Hotel у Виктория-парка (Clockenflap 6.12, Централ и Пик 7.12, Ковлун с M+ 8.12, Дисней 9.12), поезд G6080 10.12 прямо в Фужун, утром 23 минуты до гор, две ночи в Улинъюане у восточных ворот и третья в городе у 七十二奇楼: Тяньмэнь днём, вечером подсветка и костёр у 七十二奇楼, ночевать в 100 метрах от башни, потом Чунцин четырьмя ночами с базой в Цисингане или на 时代天街: 14.12 приезд и парк Цзянтань, 15.12 центр 渝中 с храмом архатов, галереей, Цикоу и шоу «1949», полный день в Улуне 16.12, 17.12 южный берег и Наньшань; 18.12 в 13:15 MU5430 в Шанхай, ночь у Пудуна и 19.12 в 11:50 MU591 — Шереметьево в 17:05, дома вечером в субботу. Внутри Китая ни одного перелёта.",
    pros:[
      "Билеты куплены, даты фиксированы",
      "Гонконг пять ночей, фестиваль в воскресенье",
      "Улун целиком: мосты и ущелье",
      "Внутри Китая только поезда, без перелётов"],
    cons:[
      "Первый день уходит на дорогу",
      "Ночь у Пудуна: долгая стыковка",
      "Будда только утром 8.12: день прилёта остаётся свободным",
      "Выезд 18.12: городом не погулять"],
    budget:"~425 000 ₽ на двоих",
  },
  {
    id:"hk-plus-day", title:"Гонконг + день: Макао или Большой Будда вместо Улуна", photo:"Hong Kong",
    dates:["04.12 · пт","05.12 · сб","06.12 · вс","07.12 · пн","08.12 · вт","09.12 · ср","10.12 · чт",
           "11.12 · пт","12.12 · сб","13.12 · вс","14.12 · пн","15.12 · вт","16.12 · ср","17.12 · чт",
           "18.12 · пт","19.12 · сб"],
    china:[MAIN_FLIGHT_OUT, MAIN_HK_ARRIVE, V3_HK_FEST, V3_HK_CENTRAL, V3_HK_KOWLOON, V3_HK_DISNEY,
           ALT_HK_EXTRA, HKF_TO_FURONG, FR_TO_ZJJ_MORNING, V3_ZJJ_AVATAR_TIANZI, V3_ZJJ_TIANMEN,
           MAIN_CQ_ARRIVE_JB, ALT_CQ_OLD, MAIN_CQ_NANAN, MAIN_CQ_TO_SH, MAIN_SH_HOME],
    hk:[],
    cities:["в пути 1 ночь","Шэньчжэнь → Гонконг 6 ночей","Фужун 1","Улинъюань 2 + город 1","Чунцин 3","Шанхай 1"],
    summary:"Тот же перелёт и те же даты 4–19.12, но шестая ночь уходит Гонконгу: 10.12 свободный день на Макао или канатку Ngong Ping 360 с Большим Буддой и деревней Tai O, 11.12 поезд G6080 в Фужун, 12.12 в горы, две ночи в Улинъюане и одна в городе, три в Чунцине. Улун и ущелье Луншуйся в этом варианте выпадают — вместо них Макао или Лантау; в Чунцине дни 16.12 центр и 17.12 южный берег, 18.12 тем же рейсом MU5430 в Шанхай, ночь у Пудуна, дома 19.12.",
    pros:[
      "Билеты и даты те же",
      "Шестая ночь: Макао или Лантау",
      "Аутлет у канатки, шопинг без дня",
      "Улун выпадает, день разгружается"],
    cons:[
      "Улуна и ущелья нет совсем",
      "Чунцин короче на одну ночь",
      "Поезда сдвигаются на день",
      "Макао — ещё граница и паром"],
    budget:"~413 000 ₽ на двоих",
  },
  {
    id:"chengdu-tibet", title:"Чэнду и Тибет", photo:"Chengdu",
    china:[CD_ARRIVE, CD_PANDA, LHASA_ARRIVE, LHASA_POTALA, LHASA_SERA, LHASA_YAMDROK, GYANTSE_SHIGATSE, SHIGATSE_LHASA, LHASA_BACK, CD_LESHAN, CD_EMEI_UP, CD_EMEI_DOWN, CD_FREE, CD_DEPART],
    hk:[],
    cities:["Чэнду 2 ночи","Лхаса 4","Гьянгдзе 1","Шигадзе 1","Лхаса 1","Чэнду 4"],
    summary:"Две недели по Сычуаню и Тибету: панды, Потала, озеро Ямдрок, Шигадзе, Лэшань и Эмэйшань. Гонконга в этом варианте нет — он остаётся на следующие поездки.",
    pros:[
      "Тибет целиком: Лхаса, Ямдрок, Шигадзе",
      "Панды в первый же день",
      "Второй блок в Чэнду без спешки"],
    cons:[
      "Тибет: пермит и обязательный гид",
      "Высота 3 650 и 4 000 метров",
      "Ноябрь: мороз, ветер, снег на перевалах"],
    budget:"выше среднего",
  },
  {
    id:"hk-macau", title:"Гонконг, Макао, Гуанчжоу и Гуйлинь", photo:"Hong Kong",
    hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, GZ_ARRIVE, GZ_DAY, GZ_TO_GL, GL_CRUISE, GL_YANGSHUO, GL_LONGSHENG, GZ_DEPART],
    cities:["Гонконг 4 + Макао 2","Гуанчжоу 2","Гуйлинь и Яншо 4","вылет из Гуанчжоу"],
    summary:"Гонконг с Макао — цель поездки, вместе ровно 6–7 дней. Вторая неделя без перелётов: 47 минут поездом до Гуанчжоу (Кантонская опера, Шамянь, храм Чэнь), потом карстовые горы Гуйлиня и Яншо с круизом по Ли и террасами Лунцзи. Домой из Гуанчжоу.",
    pros:[
      "Сначала Гонконг, потом Макао паромом",
      "Гуанчжоу: опера, Шамянь, храм Чэнь",
      "Гуйлинь: горы, река Ли, террасы",
      "Переезды только поездом, без перелётов"],
    cons:[
      "Декабрь в Гуанси: дымка без воды",
      "Финал в Гуанчжоу, рейс отдельно",
      "Макао одна ночь: только старый город"],
    budget:"средний",
  },
  {
    id:"shanghai", title:"Гонконг, Макао, Шанхай, Ханчжоу и Сучжоу", photo:"Chengdu",
    china:[], hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, SH_ARRIVE, SH_CITY, SH_TO_SZ, HZ_DAY, HZ_TO_SH, SH_DEPART],
    cities:["Гонконг 5 + Макао 3","Шанхай 3","Сучжоу 1","Ханчжоу 1","вылет из Шанхая"],
    summary:"Гонконг и Макао, потом перелёт в Шанхай: Бунд и французская концессия, сады ЮНЕСКО в Сучжоу, чайные холмы и Западное озеро в Ханчжоу. Самый архитектурный из шести вариантов.",
    pros:[
      "Архитектура: Бунд, концессия, сады, озеро",
      "Короткие переезды до Сучжоу и Ханчжоу",
      "В Гонконге пять дней",
      "Из Шанхая прямой рейс домой"],
    cons:[
      "Декабрь в дельте Янцзы: сырость",
      "Гор и спа нет, только города",
      "Гонконг → Шанхай перелётом"],
    budget:"выше среднего",
  },
  {
    id:"sanya", title:"Гонконг, Макао и Хайнань", photo:"Hong Kong",
    china:[], hk:[HK_FEST_ARRIVE_NOFEST_PLACEHOLDER, HK_KOWLOON, HK_CENTRAL, HK_LANTAU, HK_DISNEY, MACAU_ARRIVE, MACAU_CITY, MACAU_BACK, SY_ARRIVE, SY_SPA_DAY, SY_DAYTRIP, SY_LINEUP, SY_BUBBLE, SY_DEPART],
    cities:["Гонконг 5 + Макао 3","Санья 6, курорт со спа"],
    summary:"Гонконг и Макао как цель, затем прямой перелёт на Хайнань: неделя в курорте со спа, морем и тропической природой, без единого переезда до самого отъезда.",
    pros:[
      "В декабре плюс двадцать пять, тёплое море",
      "Лучшие спа Китая в Санье",
      "Прямой рейс из Гонконга",
      "Вещи распаковываются один раз"],
    cons:[
      "Старых городов и зданий почти нет",
      "Курорты Ялонг-Бэй дороже гонконгских отелей",
      "Домой через Гонконг или Шэньчжэнь"],
    budget:"выше среднего",
  },
];

return {CITIES, DATES, VARIANTS, HK_DEPART};
})();

export default TRIP_ITINERARY;
