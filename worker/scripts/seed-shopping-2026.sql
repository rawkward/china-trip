-- Покупки к поездке: списки Жене, Антону и прочее. Идемпотентно: сначала чистим свои группы.
DELETE FROM checklist_items WHERE group_id IN ('grp_zhenya','grp_anton','grp_other');
DELETE FROM checklist_groups WHERE id IN ('grp_zhenya','grp_anton','grp_other');

INSERT INTO checklist_groups (id, cap, sort, updated_at) VALUES
  ('grp_zhenya','Жене',2,strftime('%s','now')),
  ('grp_anton','Антону',3,strftime('%s','now')),
  ('grp_other','Другое',4,strftime('%s','now'));

INSERT INTO checklist_items (id, group_id, text, sort, updated_at) VALUES
 ('itm_z01','grp_zhenya','Новые спортивные часы',0,strftime('%s','now')),
 ('itm_z02','grp_zhenya','Солнцезащитные очки',1,strftime('%s','now')),
 ('itm_z03','grp_zhenya','Рюкзак или повседневная сумка под кожу',2,strftime('%s','now')),
 ('itm_z04','grp_zhenya','Трусы Uniqlo бесшовные',3,strftime('%s','now')),
 ('itm_z05','grp_zhenya','Спортивный костюм — хлопок, мягкий',4,strftime('%s','now')),
 ('itm_z06','grp_zhenya','Сапоги-трубы до колен',5,strftime('%s','now')),
 ('itm_z07','grp_zhenya','Кольцо или другое украшение',6,strftime('%s','now')),
 ('itm_z08','grp_zhenya','Куртка и штаны горнолыжные',7,strftime('%s','now')),
 ('itm_z09','grp_zhenya','Зимние треккинговые ботинки',8,strftime('%s','now')),
 ('itm_z10','grp_zhenya','Капор или другой тёплый головной убор — с учётом чёлки',9,strftime('%s','now')),
 ('itm_z11','grp_zhenya','Dyson Airwrap: Complete HS01, Copper Diffuser или i.d. Complete Long HS08 — <a href="https://proservice.one/dyson/tproduct/511848722-575257489822-stailer-dyson-hs08-airwrap-id-straightwa" target="_blank" rel="noopener">proservice.one</a>',10,strftime('%s','now')),
 ('itm_a01','grp_anton','Кроссовки',0,strftime('%s','now')),
 ('itm_a02','grp_anton','Спортивный костюм',1,strftime('%s','now')),
 ('itm_a03','grp_anton','Толстовка',2,strftime('%s','now')),
 ('itm_a04','grp_anton','Свитер или кофта',3,strftime('%s','now')),
 ('itm_a05','grp_anton','Футболки',4,strftime('%s','now')),
 ('itm_a06','grp_anton','Носки',5,strftime('%s','now')),
 ('itm_a07','grp_anton','Джинсы',6,strftime('%s','now')),
 ('itm_a08','grp_anton','Браслет Xiaomi',7,strftime('%s','now')),
 ('itm_a09','grp_anton','Триммер',8,strftime('%s','now')),
 ('itm_a10','grp_anton','Куртка и комбинезон или штаны горнолыжные',9,strftime('%s','now')),
 ('itm_o01','grp_other','Фарфор',0,strftime('%s','now')),
 ('itm_o02','grp_other','Халат из шёлка',1,strftime('%s','now')),
 ('itm_o03','grp_other','Жемчуг',2,strftime('%s','now')),
 ('itm_o04','grp_other','Чай',3,strftime('%s','now')),
 ('itm_o05','grp_other','Средство для пылесоса',4,strftime('%s','now')),
 ('itm_o06','grp_other','Красный китайский шампунь — просила Саша',5,strftime('%s','now'));
