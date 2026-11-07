DELETE FROM checklist_items WHERE group_id IN ('grp_packing','grp_home');
DELETE FROM checklist_groups WHERE id IN ('grp_packing','grp_home');

INSERT INTO checklist_groups (id, cap, sort, updated_at) VALUES
  ('grp_packing','Сборы в Китай',0,strftime('%s','now')),
  ('grp_home','Покупки домой',1,strftime('%s','now'));

INSERT INTO checklist_items (id, group_id, text, sort, updated_at) VALUES
 ('itm_p01','grp_packing','Загранпаспорт, копии, билеты и брони — копии и распечатки в папку и на телефон',0,strftime('%s','now')),
 ('itm_p02','grp_packing','Страховка на поездку — полис на всех, проверить даты',1,strftime('%s','now')),
 ('itm_p03','grp_packing','Наличные на обмен — юани или доллары, плюс немного мелочи',2,strftime('%s','now')),
 ('itm_p04','grp_packing','Карта UnionPay — РСХБ или АТБ, проверить лимиты',3,strftime('%s','now')),
 ('itm_p05','grp_packing','Alipay — установлен, привязан к карте, аккаунт проверен',4,strftime('%s','now')),
 ('itm_p06','grp_packing','eSIM или роуминг, офлайн-карты — скачать город и маршруты заранее',5,strftime('%s','now')),
 ('itm_p07','grp_packing','Компрессионные носки — на перелёт и долгие переходы',6,strftime('%s','now')),
 ('itm_p08','grp_packing','Беруши, маска для сна и снуд — в ручную кладь',7,strftime('%s','now')),
 ('itm_p09','grp_packing','Powerbank и запасной кабель — только в ручную кладь',8,strftime('%s','now')),
 ('itm_p10','grp_packing','Переходник-вилка — в Китае тип I/A, розетки не как у нас',9,strftime('%s','now')),
 ('itm_p11','grp_packing','Треккинговые ботинки и микрошипы — микрошипы на ступени и лёд',10,strftime('%s','now')),
 ('itm_p12','grp_packing','Палки для спуска — купить заранее, везти в багаже',11,strftime('%s','now')),
 ('itm_p13','grp_packing','Термобельё, дождевик, шапка и перчатки — слоями, погода в горах переменчивая',12,strftime('%s','now')),
 ('itm_p14','grp_packing','Аптечка — обезболивающее, от живота, пластырь, влажные салфетки',13,strftime('%s','now')),
 ('itm_p15','grp_packing','Крем и гигиеничка — от сухости в самолёте',14,strftime('%s','now')),
 ('itm_p16','grp_packing','Зарядка от 220 В и кабели — USB-C и Lightning по устройствам',15,strftime('%s','now')),
 ('itm_h01','grp_home','Подарки родным',0,strftime('%s','now')),
 ('itm_h02','grp_home','Чай',1,strftime('%s','now')),
 ('itm_h03','grp_home','Что-то к столу — сладости, специи, орехи',2,strftime('%s','now')),
 ('itm_h04','grp_home','Сувениры коллегам',3,strftime('%s','now')),
 ('itm_h05','grp_home','Открытки и мелочи — упаковка и пакеты для подарков',4,strftime('%s','now'));
