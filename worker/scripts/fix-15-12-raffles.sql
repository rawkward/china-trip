-- 15.12 (hk-first): снять случайную привязку карточки Raffles City к справочнику
-- «Chongqing Art Gallery» — из-за неё Raffles исчезла, а точка 5 (rgq3du = Raffles)
-- показывала галерею с координатами Raffles. Остальные правки дня сохраняются:
-- скрытые храм архатов и мост 嘉陵江大桥 и новое имя 解放碑.
UPDATE day_texts
   SET body = '{"hide":"qdky9w,l8bgeo,c5qxxx","stop:hjtwz4:name":"解放碑: Jiefangbei Pedestrian Street"}',
       updated_at = strftime('%s','now')
 WHERE variant_id = 'hk-first' AND day_date = '15.12';
