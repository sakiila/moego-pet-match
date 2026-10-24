-- 上传时选填的「主人说」：只收英文，Bob 上架时补录到名录 owner_quote。
ALTER TABLE pet_match.submissions ADD COLUMN owner_quote text;
