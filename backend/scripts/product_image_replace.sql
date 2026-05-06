BEGIN;
DELETE FROM product_image;
\copy product_image(product_id, image_url, content_type, file_name, primary_image) FROM 'C:/Users/dell/Desktop/shopflow-master/backend/product_image_insert.csv' CSV HEADER;
COMMIT;
