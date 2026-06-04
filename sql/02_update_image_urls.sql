-- ============================================================
-- Run this AFTER uploading images to Storage > products bucket
-- ============================================================

update products set image_url = 'https://dkdvzxtfcpldekhhiies.supabase.co/storage/v1/object/public/products/panneau-' || ref || '.jpg'
where category_id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- Verify
select ref, name, image_url from products order by price_ht;
