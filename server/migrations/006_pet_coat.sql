-- 毛色特征 [L, a, b, 深色占比, 浅色占比]：publish 时从贴纸计算，阵容抽样据此给外观相近的宠物降权。
ALTER TABLE pet_match.pets ADD COLUMN coat real[];
