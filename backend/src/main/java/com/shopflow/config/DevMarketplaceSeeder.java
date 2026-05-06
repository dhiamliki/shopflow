package com.shopflow.config;

import com.shopflow.entities.*;
import com.shopflow.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Component
@Profile({"dev", "prod"})
@RequiredArgsConstructor
public class DevMarketplaceSeeder implements CommandLineRunner {

    private static final String SELLER_PASSWORD = "Seller123!";
    private static final String CUSTOMER_PASSWORD = "Customer123!";
    private static final String SEED_IMAGE_MARKER = "seed-product-photo/v2/";

    private static final Map<String, ProductMediaSeed> PRODUCT_MEDIA = Map.ofEntries(
            Map.entry("Verona Satin Midi Dress", productMediaUrl("https://img.tobi.com/product_images/lg/2/off-white-pia-satin-midi-dress@2x.jpg?")),
            Map.entry("Alder Trench Coat", productMediaUrl("https://c8.alamy.com/comp/BJWKY4/trench-coat-isolated-on-white-background-BJWKY4.jpg")),
            Map.entry("Harper Leather Crossbody", productMediaUrl("https://omybagamsterdam.com/cdn/shop/products/Harper-Cognac-Classic-Leather-Back.jpg?v=1711552221&width=1920")),
            Map.entry("Luna Pearl Drop Set", productMediaUrl("https://petitesecretjewellery.com/cdn/shop/files/LunaPearlDropEarrings-silver.jpg?v=1742009800&width=990")),
            Map.entry("Marais Wool Wrap Coat", productMediaUrl("https://cdna.lystit.com/520/650/n/photos/italist/6790e018/max-mara--Long-Wool-Wrap-Coat.jpeg")),
            Map.entry("Solene Silk Halter Dress", productMediaUrl("https://www.fashionacy.com/wp-content/uploads/2023/11/white-silk-halter-dress.jpg")),
            Map.entry("Portofino Leather Tote", productMediaUrl("https://static.vecteezy.com/system/resources/previews/056/807/246/non_2x/a-white-leather-tote-bag-on-a-white-background-free-photo.jpg")),
            Map.entry("Atelier Signet Ring Stack", productMediaUrl("https://atelierdacko.com/wp-content/uploads/2023/05/AD122-Slim-Signet-Rings-1.jpg")),
            Map.entry("Riviera Pleated Evening Dress", productMediaUrl("https://img.myshopline.com/image/store/1695970754941/391e425b4m70a0ad0cb1f6e82c943df5.jpeg?w=864&h=864")),
            Map.entry("Camden Cropped Blazer", productMediaUrl("https://assets.superbalistcdn.co.za/filters:quality(75):format(jpg)/2032651/original.jpg")),
            Map.entry("Milan Chain Shoulder Bag", productMediaUrl("https://www.forevernew.com.au/media/catalog/product/A/l/AllTerritories_Mannequin_27843602_1.jpg")),
            Map.entry("Starlit Tennis Bracelet", productMediaUrl("http://sarjewels.in/cdn/shop/files/2023-08-2210-45-25_B_Radius8_Smoothing5_1024x.jpg?v=1697524031")),
            Map.entry("Nova ANC Wireless Headphones", productMediaUrl("http://www.lendmeurears.com/cdn/shop/products/nova-01__67675.1699464801.1280.1280.png?v=1709997153")),
            Map.entry("Echo Shelf Speaker Pair", productMediaUrl("https://www.ukdj.co.uk/images/e-audio-white-stereo-background-speakers-100w-p9271-49583_image.jpg")),
            Map.entry("Atlas 27-Inch 4K Display", productMediaUrl("https://www.digitaltigers.com/images/product/gallery/uvatlas27-wid1900.jpg")),
            Map.entry("Relay Mechanical Keyboard", productMediaUrl("https://cdn.shopify.com/s/files/1/0059/0630/1017/files/Keychron-J2-QMK-Wireless-Custom-Mechanical-Keyboard-RGB-Backlight-White-Keychron-Super-Red.jpg?v=1757401197&width=2048&quality=75")),
            Map.entry("Orbit USB-C Dock Station", productMediaUrl("https://m.media-amazon.com/images/I/71rRbO6O+-L._AC_SL1500_.jpg")),
            Map.entry("Pulse Portable Bluetooth Speaker", productMediaUrl("https://static.vecteezy.com/system/resources/previews/053/776/255/non_2x/bluetooth-speaker-isolated-on-white-background-for-modern-technology-showcase-on-transparent-background-png.png")),
            Map.entry("Meridian Studio Headset", productMediaUrl("https://static.vecteezy.com/system/resources/previews/056/951/850/non_2x/wireless-headset-isolated-on-white-background-photo.jpg")),
            Map.entry("FrameView 32-Inch Curved Monitor", productMediaUrl("https://viotek.com/wp-content/uploads/nb32cw-white-001-on-2-1024x1024.jpg")),
            Map.entry("Raster Wireless Mouse", productMediaUrl("https://static.vecteezy.com/system/resources/previews/063/228/942/non_2x/wireless-white-mouse-with-led-light-transparent-background-technology-product-minimalist-environment-top-view-modern-concept-free-png.png")),
            Map.entry("Signal Streaming Microphone", productMediaUrl("https://static.vecteezy.com/system/resources/previews/052/644/609/non_2x/black-wireless-microphone-isolated-on-white-background-for-audio-recording-on-transparent-background-png.png")),
            Map.entry("Halo Soundbar Mini", productMediaUrl("https://www.decorclever.com/wp-content/uploads/2024/05/Gingko-Mini-Halo-One-Speaker05.jpg")),
            Map.entry("Vector Aluminum Laptop Stand", productMediaUrl("https://c8.alamy.com/comp/2T14EHB/laptop-aluminium-stand-isolated-on-a-white-background-metal-motebook-stand-isolated-2T14EHB.jpg")),
            Map.entry("Rowan Boucle Accent Chair", productMediaUrl("https://img.zcdn.com.au/lf/50/hash/25825/20332978/4/Rowan+Boucle+Accent+Chair.jpg")),
            Map.entry("Solis Brass Floor Lamp", productMediaUrl("https://gpsqatar.com/wp-content/uploads/2022/06/52450.jpg")),
            Map.entry("Mira Stoneware Dinner Set", productMediaUrl("https://i.pinimg.com/originals/b8/9c/17/b89c17d1632a89b158432df5b33267f2.jpg")),
            Map.entry("Alder Oak Coffee Table", productMediaUrl("https://www.furnitureinfashion.net/images/alder-coffee-table-artisan-oak-white-2-drawers.jpg")),
            Map.entry("Ember Cast Iron Dutch Oven", productMediaUrl("https://embercookware.com/cdn/shop/files/DUTCH-CP-GREY.jpg?v=1732777559&width=940")),
            Map.entry("Tidal Glass Carafe Set", productMediaUrl("http://whitespastels.com/cdn/shop/files/IMG_3083_1.jpg?v=1725967328")),
            Map.entry("Lumen Linen Table Lamp", productMediaUrl("https://www.instacart.com/image-server/1200x1200/www.instacart.com/assets/domains/product-image/file/large_e0d2542b-f324-4d79-9e62-78766fee35bb.jpeg")),
            Map.entry("Haven Walnut Console", productMediaUrl("https://cdn.shopify.com/s/files/1/0540/9246/4326/products/ba-haven-solid-wood-media-console-72-26-22-drawer-natural-walnut-front_4096x.jpg?v=1621090194")),
            Map.entry("Cedar Marble Serving Board", productMediaUrl("https://static.vecteezy.com/system/resources/previews/054/198/082/large_2x/elegant-marble-and-wood-serving-boards-displayed-on-a-neutral-background-showcasing-unique-patterns-and-colors-for-dining-png.png")),
            Map.entry("Arc Ceramic Pendant Light", productMediaUrl("https://arclightsdesign.com/cdn/shop/files/WhiteCeramicBrassPendantLightFixtures-NordicJapaneseStyleHangingLampLED_26.jpg?v=1730353121&width=750")),
            Map.entry("Verona Nonstick Fry Pan", productMediaUrl("https://c8.alamy.com/comp/KPRYFB/non-stick-frying-pan-on-white-background-KPRYFB.jpg")),
            Map.entry("Woven Basket Side Table", productMediaUrl("https://glowparties.ca/wp-content/uploads/2022/08/Side-Table-–-Woven-Basket-with-Wood-Top-–-A-1643x2048.jpg")),
            Map.entry("Cloud Dew Hyaluronic Serum", productMediaUrl("http://shoprocketandroo.com/cdn/shop/files/8a67b191c0aaf1818897107aa44b1430d3d036dd780f02e83657f8338b1f523b.jpg?v=1747862948")),
            Map.entry("Barrier Repair Cream", productMediaUrl("https://shop.mychapter.com/cdn/shop/files/Barrier_Repair_Cream.png?v=1725489530&width=1500")),
            Map.entry("Root Reset Clarifying Shampoo", productMediaUrl("http://shop.wildlypure.co/cdn/shop/files/1_37.jpg?v=1729591907")),
            Map.entry("Silk Finish Thermal Brush", productMediaUrl("https://etscherrat.com/wp-content/uploads/2024/02/BFCEP23857.jpg")),
            Map.entry("Vitamin C Brightening Drops", productMediaUrl("https://lily.hr/wp-content/uploads/2022/09/Vitamin-C-Brightening-Drops-475x664.png")),
            Map.entry("Overnight Recovery Mask", productMediaUrl("https://divascosmeticskenya.com/wp-content/uploads/2021/11/Overnight-Recovery-Mask-1024x1024.png")),
            Map.entry("Restore Bond Treatment", productMediaUrl("https://cdn-cjhgk.nitrocdn.com/CXxGixRVyChwAxySbAyltuCiQXRKaWDN/assets/images/optimized/rev-9dad235/www.newbeauty.com/wp-content/uploads/2024/01/Untitled8-1024x1024.png")),
            Map.entry("Ceramic Ionic Styling Wand", productMediaUrl("https://www.planetbeauty.com/cdn/shop/files/Bio_Ionic_GoldPro_Styling_Wand_8d4365c1-f8f4-43f8-96b8-2e9f6c0c50a9_x2000.jpg?v=1721935210")),
            Map.entry("Calm Water Gel Moisturizer", productMediaUrl("https://www.dermalogica.com/cdn/shop/products/Calm-Water-Gel_1.7oz.jpg?v=1716335749&width=1646")),
            Map.entry("Peptide Firming Serum", productMediaUrl("https://vitasoul.b-cdn.net/wp-content/uploads/2023/03/eleven2_Multi_Peptide_Serum_30ml-1024x1024.png")),
            Map.entry("Scalp Balance Exfoliating Wash", productMediaUrl("https://epbgre4pqvu.exactdn.com/wp-content/uploads/2019/01/Wella-Professionals-Scalp-Balance-Deep-Cleansing-Shampoo-300-ml.webp")),
            Map.entry("AirLift Diffuser Dryer", productMediaUrl("https://c8.alamy.com/comp/DB9BKY/diffuser-dryer-on-a-white-background-DB9BKY.jpg")),
            Map.entry("Granite Grip Kettlebell 16kg", productMediaUrl("http://cdn.shopify.com/s/files/1/0105/0918/9177/products/KBSTANDARD16_media_01_1200x1200.jpg?v=1530075046")),
            Map.entry("Ridge Trail Daypack", productMediaUrl("https://slimages.macysassets.com/is/image/MCY/products/3/optimized/24157353_fpx.tif?op_sharpen=1&wid=700&hei=855&fit=fit,1")),
            Map.entry("Flow Cork Yoga Mat", productMediaUrl("https://c8.alamy.com/comp/HGT9XJ/yoga-cork-mat-premium-product-eco-friendly-on-white-background-HGT9XJ.jpg")),
            Map.entry("Northline Camping Lantern", productMediaUrl("https://c8.alamy.com/comp/CTBH09/a-camping-lantern-isolated-against-a-white-background-CTBH09.jpg")),
            Map.entry("Apex Resistance Band Kit", productMediaUrl("https://down-id.img.susercontent.com/file/3680abf111e713d1a511db9e73bb0f62")),
            Map.entry("VeloShield Road Helmet", productMediaUrl("https://static.vecteezy.com/system/resources/previews/030/400/242/large_2x/a-white-bicycle-helmet-isolated-on-white-background-safety-helmet-generative-ai-photo.jpeg")),
            Map.entry("Summit Recovery Roller", productMediaUrl("http://www.delta-fitness.com/cdn/shop/files/DF-2IN1RR_2_a28a37de-f933-4e5d-9d89-2b6916e0d0c4.jpg?crop=center&height=1200&v=1755609596&width=1200")),
            Map.entry("Alpine Two-Person Tent", productMediaUrl("https://wildascentgear.com/wp-content/uploads/2024/08/Alpine-Ascent-2P-4-Season-Tent-4.jpg")),
            Map.entry("Stride Hydration Vest", productMediaUrl("https://stride-world.com/en/cms/wp-content/uploads/2023/04/RACE_VEST.jpg")),
            Map.entry("Forge Adjustable Dumbbells", productMediaUrl("https://static.vecteezy.com/system/resources/previews/059/370/681/non_2x/adjustable-weight-dumbbells-transparent-background-free-png.png")),
            Map.entry("Cascade Sleeping Pad", productMediaUrl("https://cascademountaintech.com/cdn/shop/products/Sleeping-Pad-OR-3_1400x.jpg?v=1660938725")),
            Map.entry("Terrain Bike Floor Pump", productMediaUrl("https://c8.alamy.com/comp/D8W83E/bicycle-floor-pump-isolated-over-white-background-D8W83E.jpg")),
            Map.entry("Orbit Magnetic Builder Set", productMediaUrl("https://image.made-in-china.com/2f0j00dQyoOJzPQqbB/Amazon-Hot-Selling-DIY-Magic-Magnet-Bead-Orbit-Marble-Run-Magnetic-Building-Blocks-Toy-Kids-Educational-Magnetic-Toy-with-Light-and-Music.jpg")),
            Map.entry("Little Makers Art Caddy", productMediaUrl("https://m.media-amazon.com/images/I/51IePYF0XWL._AC_UL800_QL65_.jpg")),
            Map.entry("Cloud Silicone Bento Box", productMediaUrl("https://thelittleroom.co.za/cdn/shop/files/IMG_8160-Copy.jpg?v=1684241354&width=1946")),
            Map.entry("Moonbeam Nursery Lamp", productMediaUrl("https://www.yankodesign.com/images/design_news/2025/04/moonbeam-lamp-brings-a-poetic-slice-of-lunar-light-to-your-space/1-1.jpg")),
            Map.entry("Junior Coding Rover", productMediaUrl("https://www.thelibrarystore.com/images/uploads/stem_steam/10-00280_e_popup.jpg")),
            Map.entry("Washable Poster Paint Set", productMediaUrl("https://down-ph.img.susercontent.com/file/sg-11134201-7rbms-lp66x1mvbdjr0f")),
            Map.entry("Meadow Suction Plate Trio", productMediaUrl("https://dr9wvh6oz7mzp.cloudfront.net/i/35bc4263f0126a1db51cd3629a4fb8d1_ra,w403,h806_pa,w403,h806.jpg")),
            Map.entry("Storytime Plush Reading Nook", productMediaUrl("https://images.stockcake.com/public/7/9/f/79f0cd56-aeae-4c4a-8f7b-ffff427cd28b_large/magical-reading-nook-stockcake.jpg")),
            Map.entry("Puzzle Path Logic Tiles", productMediaUrl("https://static.vecteezy.com/system/resources/previews/066/598/312/non_2x/simple-yet-detailed-puzzle-piece-for-logic-and-strategy-games-isolated-on-transparent-background-png.png")),
            Map.entry("Craft Club Sticker Studio", productMediaUrl("https://images.twinkl.co.uk/tw1n/image/private/t_630_eco/image_repo/4b/44/t-c-7457-craft-club-stickers_ver_3.jpg")),
            Map.entry("Snuggle Cotton Swaddle Set", productMediaUrl("https://myer-media.com.au/wcsstore/MyerCatalogAssetStore/images/77/770/7947/1/1/210567820/210567820_1_2_720x928.webp?w=1920&q=75")),
            Map.entry("Rainbow Growth Chart", productMediaUrl("https://i.etsystatic.com/5199991/r/il/65f27b/2122187891/il_1140xN.2122187891_9zzw.jpg")),
            Map.entry("Midnight Harbor: A Novel", productMediaUrl("https://m.media-amazon.com/images/I/71pBH46-RqL._SL1500_.jpg")),
            Map.entry("Design Systems Field Guide", productMediaUrl("https://designerup.co/blog/content/images/2024/09/Screenshot-2024-09-28-at-3.27.52-PM.png")),
            Map.entry("Daily Focus Linen Planner", productMediaUrl("https://fullfocusstore.com/cdn/shop/files/full-focus-planner-linen-246822_1728x_a51c9b3a-f435-48f7-aff2-8e28ff0fef99_1024x1024.webp?v=1699246670")),
            Map.entry("Brass Grid Desk Organizer", productMediaUrl("https://p1.liveauctioneers.com/3627/149352/75550446_1_x.jpg?height=512&quality=70&version=1567828414")),
            Map.entry("The Quiet Department", productMediaUrl("https://www.officepal.co.th/uploads/images/200215141903FxqN.jpg")),
            Map.entry("Creative Strategy Workbook", productMediaUrl("http://interstellarcre8tions.com/cdn/shop/files/Untitleddesign_23.png?v=1721100312")),
            Map.entry("Softcover Dot Journal Set", productMediaUrl("https://www.moo.com/dam/jcr:3b277126-b3d5-437d-8197-c14d985ad128/0099WF-PO-1152x1152-softcover-journals.jpg")),
            Map.entry("Precision Gel Pen Trio", productMediaUrl("https://media.s-bol.com/gDJpYy5OM23D/OErV1N/550x550.jpg")),
            Map.entry("Atlas of Small Adventures", productMediaUrl("https://www.waywardblog.com/wp-content/uploads/2018/12/Atlas-of-Adventures.jpg")),
            Map.entry("Notes on Slow Living", productMediaUrl("https://i.pinimg.com/originals/25/18/88/25188823a89f0706e220212168d909f6.jpg")),
            Map.entry("Walnut Monitor Riser", productMediaUrl("https://iwoodstore.com/cdn/shop/files/solid-walnut-computer-monitor-riser-iwoodstore-229518.jpg?v=1717693761&width=1946")),
            Map.entry("Weekly Desk Pad", productMediaUrl("https://assets.kmart.com.au/transform/64f5f260-769b-448d-9d7f-10b4fb4286de/43343089-1?io=transform:fit,width:3840,height:3840&quality=90")),
            Map.entry("Harbor Orthopedic Dog Bed", productMediaUrl("https://www.nandog.com/cdn/shop/files/memory-foam-orthopedic-dog-bed-largeoff-white-742706_1200x1200.jpg?v=1717475248")),
            Map.entry("Rover Trail Travel Crate", productMediaUrl("http://www.shopbarnabe.com/cdn/shop/files/TOPOROVERTRAILPACK-BONEWHITE-FW25-3BONEWHITEcopie.jpg?v=1757947157&width=1200")),
            Map.entry("TugTime Rope Toy Pack", productMediaUrl("http://petsdomain.com.au/cdn/shop/files/40265-1WagTime-Rope-Toy-Tug-Rope-Back-WEB_grande.jpg?v=1690524346")),
            Map.entry("Whisker Ceramic Feeding Station", productMediaUrl("https://ae01.alicdn.com/kf/S50f3977eed5540aeacddbf45ffb36631K.jpg")),
            Map.entry("Cedar Cat Climbing Post", productMediaUrl("https://habitathaven.com/cdn/shop/files/catio-scratch-post-outdoor-cat-climbing-post-316499_1200x.jpg?v=1711649540")),
            Map.entry("CalmPaws Lick Mat", productMediaUrl("http://calmingpup.com/cdn/shop/files/Lick_Mat_Blue_Size_Dimensions.jpg?v=1721077413")),
            Map.entry("Seaside Waterproof Lead Set", productMediaUrl("https://static.wixstatic.com/media/ec9a2f_d7b14932941d42babde984cec8727342~mv2.png/v1/fill/w_980,h_1162,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/ec9a2f_d7b14932941d42babde984cec8727342~mv2.png")),
            Map.entry("Feather Dash Teaser Wand", productMediaUrl("https://chubbymeows.com/wp-content/uploads/2022/04/Feather-Wand-Stick-with-Bell-Teaser-Toy-For-Cats-01.png")),
            Map.entry("Elevated Birch Bowl Stand", productMediaUrl("https://kyahomedecor.com/cdn/shop/products/image_59706c29-54f8-4866-964c-6bafaddf7a48.jpg?v=1666104500&width=713")),
            Map.entry("Window Hammock Lounger", productMediaUrl("https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI1LTAxL3Jhd3BpeGVsb2ZmaWNlN19oYW1tb2NrX3dpdGhfY2xlYW5fbGluZXNfaXNvbGF0ZWRfb25fYV93aGl0ZV9iYV85NzhjY2YyNC1iNzhhLTQwMzYtODY2NS03ZmNlYzJjNzVjMjUtbTY3cDN3dnUucG5n.png")),
            Map.entry("Training Treat Pouch", productMediaUrl("https://royalpetinc.com/images/virtuemart/product/70167_FT2.jpg")),
            Map.entry("Sisal Corner Scratch Ramp", productMediaUrl("https://m.media-amazon.com/images/I/816o6XTCuBL._AC_UF1000,1000_QL80_.jpg")),
            Map.entry("Atlas Roast Coffee Beans", productMediaUrl("https://static.vecteezy.com/system/resources/previews/045/654/482/non_2x/roasted-coffee-beans-isolated-on-white-background-psd.png")),
            Map.entry("Citrus Grove Extra Virgin Olive Oil", productMediaUrl("https://c8.alamy.com/comp/B8AW4B/extra-virgin-olive-oil-and-olives-isolated-on-white-background-B8AW4B.jpg")),
            Map.entry("Monsoon Masala Chai Tin", productMediaUrl("https://i.pinimg.com/originals/7c/89/c3/7c89c3b0225e24a6ceeaa1d75820ea79.png")),
            Map.entry("Sea Salt Dark Chocolate Squares", productMediaUrl("https://static.vecteezy.com/system/resources/previews/048/161/453/non_2x/dark-chocolate-squares-with-sea-salt-free-photo.jpg")),
            Map.entry("Barrel-Aged Balsamic Reserve", productMediaUrl("https://www.shoppigment.com/cdn/shop/files/barrel-aged-balsamic-vinegar.jpg?v=1731350392&width=2048")),
            Map.entry("Breakfast Pantry Gift Box", productMediaUrl("https://irp.cdn-website.com/f26571c6/dms3rep/multi/ON-THE-GO+BREAKFAST+BOX.jpg")),
            Map.entry("Bloom Jasmine Green Tea", productMediaUrl("https://c8.alamy.com/comp/D5T47J/green-tea-with-jasmine-flowers-isolated-on-white-background-D5T47J.jpg")),
            Map.entry("Sicilian Lemon Olive Oil", productMediaUrl("http://shop.old-mill.com/cdn/shop/files/SicilianLemonoliveoil250ml.jpg?v=1708363856")),
            Map.entry("Roasted Hazelnut Truffle Box", productMediaUrl("https://5.imimg.com/data5/SELLER/Default/2023/7/325452361/MS/HI/GR/192694650/roasted-hazelnut-front-1000x1000.jpg")),
            Map.entry("Mediterranean Tapas Gift Crate", productMediaUrl("https://res.cloudinary.com/tienda-com/image/upload/f_auto/q_auto/c_fill,w_680/dpr_2.0/v1/products/bt-24")),
            Map.entry("Espresso Blend Capsules", productMediaUrl("https://c8.alamy.com/comp/KTH7K2/espresso-coffee-capsules-isolated-on-white-background-closeup-view-KTH7K2.jpg")),
            Map.entry("Smoked Chili Olive Oil", productMediaUrl("https://c8.alamy.com/comp/BR2DAY/chili-infused-olive-oil-over-white-background-BR2DAY.jpg")),
            Map.entry("TorqueMax Cordless Drill", productMediaUrl("https://static.vecteezy.com/system/resources/previews/060/110/451/non_2x/cordless-drill-on-white-background-close-up-tool-equipment-power-free-photo.jpg")),
            Map.entry("Precision Ratchet Socket Set", productMediaUrl("http://www.liontoolsmart.com/cdn/shop/articles/61GIeYAYt6L_1024x1024.jpg?v=1732694154")),
            Map.entry("RoadReady Emergency Battery Pack", productMediaUrl("https://batterypowerzone.co.za/cdn/shop/products/ENR_AUGP1_E303276800_Auto_Care_Pack_Packaging_20Image_UPN162208_EMEA_1024x1024.jpg?v=1684858150")),
            Map.entry("Leather Guard Interior Kit", productMediaUrl("https://asset.targetfurniture.co.nz/image/LGLPSNG/leather_guard_single_target_furniture_nz@01.jpg")),
            Map.entry("SteelCore Impact Driver", productMediaUrl("https://buildingmaterials.com.my/storage/photo/3/54937/large.jpg")),
            Map.entry("FlexGrip Hex Key Bundle", productMediaUrl("https://m.media-amazon.com/images/I/61bvYZ77cwL._AC_.jpg")),
            Map.entry("All-Weather Trunk Organizer", productMediaUrl("https://m.media-amazon.com/images/I/71Fk9A7B2vL._AC_SL1500_.jpg")),
            Map.entry("Ceramic Wash & Wax Duo", productMediaUrl("https://ucarecdn.com/14e7de2e-98b6-4fd6-a721-48ed05cc2d7b/-/format/auto/-/preview/1024x1024/-/quality/lighter/SP-HCWW-16-Group.jpg")),
            Map.entry("Workshop Magnetic Light Bar", productMediaUrl("https://images.squarespace-cdn.com/content/v1/6306c4806c80590480b4281c/1729428911397-F282TLGQSHJ878EPJ6E3/gladius-cob-led-work-light-eastwood.jpg?format=750w")),
            Map.entry("Compact Tire Inflator", productMediaUrl("https://static.vecteezy.com/system/resources/previews/068/317/306/large_2x/tire-inflator-device-free-png.png")),
            Map.entry("Microfiber Detailing Towel Pack", productMediaUrl("https://www.autofiber.com/cdn/shop/files/365gsm16x241_1000x667.jpg?v=1687533504")),
            Map.entry("Trailside Safety Kit", productMediaUrl("https://image.made-in-china.com/2f0j00BziclCRhgpoL/Auto-Roadside-Travel-Safety-Kit.jpg"))
    );

    private static ProductMediaSeed productMediaUrl(String url) {
        return new ProductMediaSeed(url, List.of(url));
    }

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        ensureAdminUser();
        List<SellerSeed> sellerSeeds = sellerSeeds();
        List<CustomerSeed> customerSeeds = customerSeeds();
        Map<String, Category> categoriesByName = createCategoryTree();
        if (isSeedComplete(sellerSeeds)) {
            return;
        }

        Map<String, User> sellersByEmail = createSellers(sellerSeeds);
        List<User> customers = createCustomers(customerSeeds);
        Map<String, Coupon> couponsByCode = createCoupons();
        List<Product> products = createProducts(sellerSeeds, sellersByEmail, categoriesByName);
        createReviews(products, customers);
        Map<User, List<Address>> customerAddresses = createCustomerAddresses(customers);
        createOrders(customers, customerAddresses, products);
        createCarts(customers, products, couponsByCode);
    }

    private void ensureAdminUser() {
        final String adminEmail = "admin@shopflow.com";
        final String adminPassword = "Admin123!";

        User admin = userRepository.findByEmail(adminEmail)
                .orElseGet(() -> User.builder()
                        .email(adminEmail)
                        .build());

        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        if (admin.getPassword() == null || !passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
        }

        userRepository.save(admin);
    }

    private boolean isSeedComplete(List<SellerSeed> sellerSeeds) {
        long expectedProducts = sellerSeeds.stream()
                .mapToLong(seed -> seed.products().size())
                .sum();
        if (productRepository.count() < expectedProducts || !userRepository.existsByEmail("seller9@shopflow.com")) {
            return false;
        }

        return sellerSeeds.stream().allMatch(sellerSeed ->
                sellerSeed.products().stream().allMatch(productSeed ->
                        productRepository.findBySeller_EmailAndNameIgnoreCase(sellerSeed.email(), productSeed.name())
                                .isPresent()));
    }

    private boolean hasCurrentSeedImages(Product product, ProductMediaSeed expectedMedia) {
        List<ProductImage> images = sortedImages(product);
        List<String> expectedUrls = expectedMedia.urls();
        if (images.size() != expectedUrls.size()) {
            return false;
        }

        for (int i = 0; i < images.size(); i++) {
            ProductImage image = images.get(i);
            if (!Objects.equals(image.getImageUrl(), expectedUrls.get(i))
                    || (image.getImageData() != null && image.getImageData().length > 0)
                    || image.getFileName() == null
                    || !image.getFileName().startsWith(SEED_IMAGE_MARKER)) {
                return false;
            }
        }
        return true;
    }

    private List<ProductImage> sortedImages(Product product) {
        return product.getImages().stream()
                .sorted(Comparator
                        .comparing(ProductImage::isPrimaryImage)
                        .reversed()
                        .thenComparing(image -> image.getId() == null ? Long.MAX_VALUE : image.getId()))
                .toList();
    }

    private Map<String, User> createSellers(List<SellerSeed> sellerSeeds) {
        Map<String, User> sellers = new LinkedHashMap<>();

        for (SellerSeed seed : sellerSeeds) {
            User user = userRepository.findByEmail(seed.email())
                    .orElseGet(() -> userRepository.save(User.builder()
                            .email(seed.email())
                            .password(passwordEncoder.encode(SELLER_PASSWORD))
                            .firstName(seed.firstName())
                            .lastName(seed.lastName())
                            .role(Role.SELLER)
                            .active(true)
                            .build()));

            SellerProfile profile = sellerProfileRepository.findByUser(user)
                    .orElseGet(() -> SellerProfile.builder().user(user).build());
            profile.setShopName(seed.shopName());
            profile.setDescription(seed.description());
            profile.setLogoUrl(seed.logoUrl());
            profile.setRating(seed.rating());
            sellerProfileRepository.save(profile);

            sellers.put(seed.email(), user);
        }

        return sellers;
    }

    private List<User> createCustomers(List<CustomerSeed> customerSeeds) {
        List<User> customers = new ArrayList<>();
        for (CustomerSeed seed : customerSeeds) {
            User customer = userRepository.findByEmail(seed.email())
                    .orElseGet(() -> userRepository.save(User.builder()
                            .email(seed.email())
                            .password(passwordEncoder.encode(CUSTOMER_PASSWORD))
                            .firstName(seed.firstName())
                            .lastName(seed.lastName())
                            .role(Role.CUSTOMER)
                            .active(true)
                            .build()));
            customers.add(customer);
        }
        return customers;
    }

    private Map<String, Coupon> createCoupons() {
        List<CouponSeed> couponSeeds = List.of(
                new CouponSeed("WELCOME10", CouponType.PERCENT, 10.0, 75.0, 2500, 108, true),
                new CouponSeed("FREESHIP12", CouponType.FIXED, 12.0, 90.0, 1800, 61, true),
                new CouponSeed("HOME20", CouponType.PERCENT, 20.0, 180.0, 900, 34, true),
                new CouponSeed("TECH40", CouponType.FIXED, 40.0, 350.0, 700, 19, true)
        );

        Map<String, Coupon> coupons = new LinkedHashMap<>();
        for (CouponSeed seed : couponSeeds) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(seed.code())
                    .orElseGet(() -> Coupon.builder().code(seed.code()).build());
            coupon.setType(seed.type());
            coupon.setValue(seed.value());
            coupon.setMinOrderAmount(seed.minOrderAmount());
            coupon.setMaxUsages(seed.maxUsages());
            coupon.setCurrentUsages(seed.currentUsages());
            coupon.setActive(seed.active());
            coupon.setExpiresAt(LocalDateTime.now().plusYears(2));
            coupons.put(seed.code(), couponRepository.save(coupon));
        }
        return coupons;
    }

    private Map<String, Category> createCategoryTree() {
        Map<String, Category> categories = new LinkedHashMap<>();

        for (DepartmentSeed department : departmentSeeds()) {
            Category root = upsertCategory(department.name(), department.description(), null);
            categories.put(department.name(), root);

            for (CategoryBranchSeed branch : department.branches()) {
                String branchName = branchName(department.name(), branch.name());
                Category branchCategory = upsertCategory(branchName, branch.description(), root);
                categories.put(branchName, branchCategory);

                for (CategoryLeafSeed leaf : branch.leaves()) {
                    String leafName = leafName(department.name(), branch.name(), leaf.name());
                    Category leafCategory = upsertCategory(leafName, leaf.description(), branchCategory);
                    categories.put(leafName, leafCategory);
                }
            }
        }

        return categories;
    }

    private Category upsertCategory(String name, String description, Category parent) {
        Category category = categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> Category.builder().name(name).build());
        category.setName(name);
        category.setDescription(description);
        category.setParent(parent);
        return categoryRepository.save(category);
    }

    private List<Product> createProducts(List<SellerSeed> sellerSeeds,
                                         Map<String, User> sellersByEmail,
                                         Map<String, Category> categoriesByName) {
        List<Product> products = new ArrayList<>();

        for (int sellerIndex = 0; sellerIndex < sellerSeeds.size(); sellerIndex++) {
            SellerSeed sellerSeed = sellerSeeds.get(sellerIndex);
            User seller = sellersByEmail.get(sellerSeed.email());

            for (int productIndex = 0; productIndex < sellerSeed.products().size(); productIndex++) {
                ProductSeed seed = sellerSeed.products().get(productIndex);
                String branchName = branchName(sellerSeed.department(), seed.section());
                String leafName = leafName(sellerSeed.department(), seed.section(), seed.leaf());
                LocalDateTime createdAt = LocalDateTime.now().minusDays(6L + ((sellerIndex * 17L + productIndex * 9L) % 220L));

                Product product = productRepository.findBySeller_EmailAndNameIgnoreCase(sellerSeed.email(), seed.name())
                        .orElseGet(() -> Product.builder()
                                .seller(seller)
                                .name(seed.name())
                                .createdAt(createdAt)
                                .build());

                product.setSeller(seller);
                product.setName(seed.name());
                product.setDescription(buildDescription(seed, sellerSeed));
                product.setPrice(round(seed.price()));
                product.setPromoPrice(seed.promoPercent() == null ? null : round(seed.price() * (100 - seed.promoPercent()) / 100.0));
                product.setActive(true);
                product.setStock(seed.stock());
                product.setSalesCount(seed.salesCount());
                if (product.getCreatedAt() == null) {
                    product.setCreatedAt(createdAt);
                }

                product.getCategories().clear();
                product.getCategories().add(categoriesByName.get(sellerSeed.department()));
                product.getCategories().add(categoriesByName.get(branchName));
                product.getCategories().add(categoriesByName.get(leafName));

                attachImages(product, seed);
                if (product.getVariants().isEmpty()) {
                    addVariants(product, seed.variantProfile(), seed.stock());
                }

                products.add(productRepository.save(product));
            }
        }

        return products;
    }

    private void createReviews(List<Product> products, List<User> customers) {
        Map<String, List<String>> commentsByDepartment = Map.of(
                "Fashion", List.of(
                        "The fit feels premium and the finishing details are worth the price.",
                        "Beautiful texture, clean stitching, and it arrived looking exactly like the photos.",
                        "Looks polished in person and pairs easily with the rest of my wardrobe.",
                        "Gifted this to my sister and she asked where the store was immediately."
                ),
                "Electronics", List.of(
                        "Setup took minutes and the performance has been reliable every day since.",
                        "Excellent value for the feature set and the packaging felt premium.",
                        "Noticeably better build quality than the last model I bought in this price range.",
                        "Fast shipping, easy pairing, and the seller responded quickly to my question."
                ),
                "Home & Living", List.of(
                        "The materials feel durable and the finish gives the room a more elevated look.",
                        "Well packed, easy to style, and it feels more expensive than it is.",
                        "Exactly the kind of practical statement piece I hoped for.",
                        "Arrived safely and instantly made my kitchen feel more put together."
                ),
                "Beauty", List.of(
                        "Gentle on my skin and the texture is far more luxurious than expected.",
                        "Noticed a difference after the first week and the scent is subtle, not overpowering.",
                        "The packaging is clean, the formula layers well, and nothing irritated my skin.",
                        "A repeat purchase for me because it actually performs the way it claims."
                ),
                "Sports", List.of(
                        "Solid build quality and easy to use whether at home or outdoors.",
                        "Feels sturdy, stores well, and has already been through a full week of workouts.",
                        "Used it on a weekend trip and it held up better than expected.",
                        "Good weight, quality straps, and no issues after repeated use."
                ),
                "Kids & Toys", List.of(
                        "My niece stayed engaged for a full afternoon and kept coming back to it.",
                        "Bright, sturdy, and clearly designed with real kid use in mind.",
                        "Easy to clean up and surprisingly durable for how much play it gets.",
                        "A thoughtful product that feels educational without being boring."
                ),
                "Books & Stationery", List.of(
                        "Great paper quality and the design makes it feel special on the desk.",
                        "Thoughtful layout, smooth writing feel, and arrived in perfect condition.",
                        "The kind of item that makes everyday work feel a little more organized.",
                        "Picked it up as a gift and ended up ordering a second one for myself."
                ),
                "Pet Supplies", List.of(
                        "My dog took to it right away and the materials still look new.",
                        "Practical design, easy to clean, and clearly made for daily use.",
                        "Even my picky cat accepted it faster than I expected.",
                        "Strong stitching, stable base, and it has survived rough play so far."
                ),
                "Grocery & Gourmet", List.of(
                        "Fresh, flavorful, and packaged well enough that I would order it again confidently.",
                        "Tastes elevated without feeling overly precious or complicated.",
                        "A reliable pantry upgrade that also makes a great host gift.",
                        "The aroma was excellent the moment I opened the package."
                ),
                "Automotive & Tools", List.of(
                        "Feels dependable in hand and everything in the set fits together properly.",
                        "Used this during a weekend project and it saved me a second trip to the store.",
                        "Well made, compact, and easy to keep organized in the garage.",
                        "Good weight, smart case design, and no cheap feeling parts."
                )
        );

        for (int productIndex = 0; productIndex < products.size(); productIndex++) {
            Product product = products.get(productIndex);
            if (reviewRepository.existsByProduct_Id(product.getId())) {
                continue;
            }
            String department = rootCategoryName(product);
            List<String> commentBank = commentsByDepartment.getOrDefault(department, commentsByDepartment.get("Home & Living"));
            int reviewCount = 2 + (int) (product.getSalesCount() % 4);

            for (int reviewIndex = 0; reviewIndex < reviewCount; reviewIndex++) {
                User customer = customers.get((productIndex + reviewIndex) % customers.size());
                int rating = ((productIndex + reviewIndex) % 9 == 0) ? 4 : 5;
                if ((productIndex + reviewIndex) % 17 == 0) {
                    rating = 3;
                }

                reviewRepository.save(Review.builder()
                        .product(product)
                        .user(customer)
                        .rating(rating)
                        .comment(commentBank.get((productIndex + reviewIndex) % commentBank.size()))
                        .approved(true)
                        .createdAt(LocalDateTime.now().minusDays(2L + ((productIndex * 5L + reviewIndex * 3L) % 160L)))
                        .build());
            }
        }
    }

    private Map<User, List<Address>> createCustomerAddresses(List<User> customers) {
        String[] streets = {
                "Avenue Habib Bourguiba",
                "Rue du Lac Turkana",
                "Rue de Marseille",
                "Avenue de la Liberte",
                "Rue de la Republique",
                "Avenue Taieb Mhiri"
        };
        String[] cities = {"Tunis", "Sfax", "Sousse", "Nabeul", "Monastir", "Bizerte"};

        Map<User, List<Address>> addressesByCustomer = new LinkedHashMap<>();
        for (int i = 0; i < customers.size(); i++) {
            User customer = customers.get(i);
            List<Address> addresses = new ArrayList<>(addressRepository.findByUser(customer));
            if (addresses.size() < 1) {
                addresses.add(addressRepository.save(Address.builder()
                        .user(customer)
                        .street((12 + i) + " " + streets[i % streets.length])
                        .city(cities[i % cities.length])
                        .postalCode("10" + (30 + i))
                        .country("Tunisia")
                        .principal(true)
                        .build()));
            }
            if (addresses.size() < 2) {
                addresses.add(addressRepository.save(Address.builder()
                        .user(customer)
                        .street((88 + i) + " " + streets[(i + 2) % streets.length])
                        .city(cities[(i + 2) % cities.length])
                        .postalCode("20" + (45 + i))
                        .country("Tunisia")
                        .principal(false)
                        .build()));
            }

            addressesByCustomer.put(customer, addresses.stream().limit(2).toList());
        }
        return addressesByCustomer;
    }

    private void createOrders(List<User> customers,
                              Map<User, List<Address>> customerAddresses,
                              List<Product> products) {
        OrderStatus[] statuses = {
                OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
                OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PAID,
                OrderStatus.PENDING, OrderStatus.CANCELLED
        };

        for (int orderIndex = 0; orderIndex < 96; orderIndex++) {
            String orderNumber = "SF-" + (410000 + orderIndex);
            if (orderRepository.existsByOrderNumber(orderNumber)) {
                continue;
            }
            User customer = customers.get(orderIndex % customers.size());
            List<Address> addresses = customerAddresses.get(customer);
            Address shippingAddress = addresses.get(orderIndex % addresses.size());
            OrderStatus status = statuses[orderIndex % statuses.length];
            LocalDateTime createdAt = LocalDateTime.now().minusDays(3L + ((orderIndex * 4L) % 180L));

            Order order = Order.builder()
                    .orderNumber(orderNumber)
                    .customer(customer)
                    .status(status)
                    .shippingAddress(shippingAddress)
                    .createdAt(createdAt)
                    .statusUpdatedAt(createdAt.plusHours(4 + (orderIndex % 48)))
                    .isNew(orderIndex % 4 == 0)
                    .refunded(false)
                    .build();

            int itemCount = 1 + (orderIndex % 4);
            double subtotal = 0.0;
            Set<Long> usedProductIds = new HashSet<>();

            for (int itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                Product product = pickUniqueProduct(products, usedProductIds, orderIndex * 7 + itemIndex * 13);
                ProductVariant variant = product.getVariants().isEmpty()
                        ? null
                        : product.getVariants().get((orderIndex + itemIndex) % product.getVariants().size());
                int quantity = 1 + ((orderIndex + itemIndex) % 3);
                double unitPrice = effectiveUnitPrice(product, variant);
                double totalPrice = round(unitPrice * quantity);
                subtotal += totalPrice;

                order.getItems().add(OrderItem.builder()
                        .order(order)
                        .product(product)
                        .variant(variant)
                        .quantity(quantity)
                        .unitPrice(round(unitPrice))
                        .totalPrice(totalPrice)
                        .build());

                if (status != OrderStatus.CANCELLED) {
                    product.setSalesCount(product.getSalesCount() + quantity);
                }
            }

            double discount = (orderIndex % 6 == 0) ? round(subtotal * 0.10) : (orderIndex % 10 == 0 ? 12.0 : 0.0);
            String appliedCoupon = discount > 0 ? (orderIndex % 10 == 0 ? "FREESHIP12" : "WELCOME10") : null;
            double shippingFee = subtotal - discount >= 150 ? 0.0 : 12.0;
            double totalAmount = round(subtotal - discount + shippingFee);

            order.setSubtotal(round(subtotal));
            order.setDiscountAmount(discount);
            order.setShippingFee(shippingFee);
            order.setTotalTtc(totalAmount);
            order.setTotalAmount(totalAmount);
            order.setAppliedCouponCode(appliedCoupon);

            orderRepository.save(order);
        }

        productRepository.saveAll(products);
    }

    private void createCarts(List<User> customers, List<Product> products, Map<String, Coupon> couponsByCode) {
        for (int customerIndex = 0; customerIndex < Math.min(5, customers.size()); customerIndex++) {
            User customer = customers.get(customerIndex);
            Cart cart = cartRepository.findByUser(customer).orElseGet(() -> Cart.builder().user(customer).build());
            cart.getItems().clear();

            int itemCount = 2 + (customerIndex % 3);
            for (int itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                Product product = products.get((customerIndex * 19 + itemIndex * 11) % products.size());
                ProductVariant variant = product.getVariants().isEmpty()
                        ? null
                        : product.getVariants().get((customerIndex + itemIndex) % product.getVariants().size());
                cart.getItems().add(CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .variant(variant)
                        .quantity(1 + ((customerIndex + itemIndex) % 2))
                        .build());
            }

            cart.setCoupon(customerIndex % 2 == 0 ? couponsByCode.get("WELCOME10") : couponsByCode.get("FREESHIP12"));
            cartRepository.save(cart);
        }
    }

    private Product pickUniqueProduct(List<Product> products, Set<Long> usedProductIds, int startIndex) {
        for (int offset = 0; offset < products.size(); offset++) {
            Product candidate = products.get((startIndex + offset) % products.size());
            if (usedProductIds.add(candidate.getId())) {
                return candidate;
            }
        }
        return products.get(startIndex % products.size());
    }

    private void attachImages(Product product, ProductSeed seed) {
        product.getImages().clear();

        ProductMediaSeed media = mediaFor(seed.name());
        Set<String> seenUrls = new HashSet<>();
        List<String> urls = media.urls();
        for (int i = 0; i < urls.size(); i++) {
            String imageUrl = urls.get(i);
            if (!seenUrls.add(imageUrl)) {
                throw new IllegalStateException("Duplicate seed media URL for " + seed.name());
            }

            String fileName = SEED_IMAGE_MARKER + slugify(seed.name()) + "-" + (i + 1) + ".jpg";
            product.getImages().add(ProductImage.builder()
                    .product(product)
                    .imageUrl(imageUrl)
                    .imageData(null)
                    .contentType("image/jpeg")
                    .fileName(fileName)
                    .primaryImage(i == 0)
                    .build());
        }
    }

    private ProductMediaSeed mediaFor(String productName) {
        ProductMediaSeed media = PRODUCT_MEDIA.get(productName);
        if (media == null) {
            throw new IllegalStateException("Missing seed media for product: " + productName);
        }
        return media;
    }

    private String slugify(String value) {
        String slug = value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isBlank() ? "product" : slug;
    }

    private void addVariants(Product product, VariantProfile profile, int stock) {
        int first = Math.max(2, stock / 3);
        int second = Math.max(2, stock / 4);
        int third = Math.max(1, stock / 5);

        switch (profile) {
            case FASHION_SIZE -> {
                addVariant(product, "Size", "S", 0.0, first);
                addVariant(product, "Size", "M", 8.0, second);
                addVariant(product, "Size", "L", 16.0, third);
            }
            case ACCESSORY_FINISH -> {
                addVariant(product, "Finish", "Gold Tone", 0.0, first);
                addVariant(product, "Finish", "Silver Tone", 6.0, second);
                addVariant(product, "Finish", "Limited Edition", 14.0, third);
            }
            case ELECTRONICS_COLOR -> {
                addVariant(product, "Color", "Midnight Black", 0.0, first);
                addVariant(product, "Color", "Silver", 10.0, second);
                addVariant(product, "Color", "Forest", 12.0, third);
            }
            case DISPLAY_SIZE -> {
                addVariant(product, "Size", "27 in", 0.0, first);
                addVariant(product, "Size", "32 in", 60.0, second);
                addVariant(product, "Size", "Ultrawide", 120.0, third);
            }
            case HOME_FINISH -> {
                addVariant(product, "Finish", "Oak", 0.0, first);
                addVariant(product, "Finish", "Walnut", 18.0, second);
                addVariant(product, "Finish", "Black Ash", 22.0, third);
            }
            case HOME_SIZE -> {
                addVariant(product, "Size", "Small", 0.0, first);
                addVariant(product, "Size", "Medium", 14.0, second);
                addVariant(product, "Size", "Large", 26.0, third);
            }
            case BEAUTY_SIZE -> {
                addVariant(product, "Size", "50 ml", 0.0, first);
                addVariant(product, "Size", "100 ml", 10.0, second);
                addVariant(product, "Size", "150 ml", 16.0, third);
            }
            case BEAUTY_SCENT -> {
                addVariant(product, "Profile", "Unscented", 0.0, first);
                addVariant(product, "Profile", "Citrus", 4.0, second);
                addVariant(product, "Profile", "Botanical", 4.0, third);
            }
            case SPORTS_SIZE -> {
                addVariant(product, "Size", "Standard", 0.0, first);
                addVariant(product, "Size", "Extended", 12.0, second);
                addVariant(product, "Size", "Pro", 24.0, third);
            }
            case SPORTS_PACK -> {
                addVariant(product, "Pack", "Starter", 0.0, first);
                addVariant(product, "Pack", "Team", 18.0, second);
                addVariant(product, "Pack", "Travel", 10.0, third);
            }
            case KIDS_AGE -> {
                addVariant(product, "Age", "3+", 0.0, first);
                addVariant(product, "Age", "5+", 6.0, second);
                addVariant(product, "Age", "7+", 10.0, third);
            }
            case BOOK_FORMAT -> {
                addVariant(product, "Format", "Softcover", 0.0, first);
                addVariant(product, "Format", "Hardcover", 8.0, second);
                addVariant(product, "Format", "Gift Edition", 16.0, third);
            }
            case DESK_COLOR -> {
                addVariant(product, "Color", "Walnut", 0.0, first);
                addVariant(product, "Color", "Matte Black", 6.0, second);
                addVariant(product, "Color", "Stone", 6.0, third);
            }
            case PET_SIZE -> {
                addVariant(product, "Size", "Small", 0.0, first);
                addVariant(product, "Size", "Medium", 10.0, second);
                addVariant(product, "Size", "Large", 18.0, third);
            }
            case PET_PACK -> {
                addVariant(product, "Pack", "Single", 0.0, first);
                addVariant(product, "Pack", "2-Pack", 8.0, second);
                addVariant(product, "Pack", "Family Pack", 16.0, third);
            }
            case GROCERY_PACK -> {
                addVariant(product, "Pack", "Single", 0.0, first);
                addVariant(product, "Pack", "2-Pack", 7.0, second);
                addVariant(product, "Pack", "Gift Set", 16.0, third);
            }
            case TOOLS_KIT -> {
                addVariant(product, "Kit", "Core", 0.0, first);
                addVariant(product, "Kit", "Workshop", 18.0, second);
                addVariant(product, "Kit", "Pro", 34.0, third);
            }
        }
    }

    private void addVariant(Product product, String attributeName, String attributeValue, double priceDelta, int stock) {
        product.getVariants().add(ProductVariant.builder()
                .product(product)
                .attributeName(attributeName)
                .attributeValue(attributeValue)
                .priceDelta(priceDelta)
                .stock(stock)
                .build());
    }

    private String buildDescription(ProductSeed seed, SellerSeed sellerSeed) {
        return seed.name() + " from " + sellerSeed.shopName() + " is tailored for " + seed.summary() + ". "
                + "This listing sits inside " + seed.leaf().toLowerCase() + " with polished presentation, dependable stock, and fast fulfillment. "
                + "Customers choose it for quality materials, thoughtful finishing details, and consistent day-to-day performance.";
    }

    private String rootCategoryName(Product product) {
        return product.getCategories().stream()
                .filter(category -> category.getParent() == null)
                .map(Category::getName)
                .findFirst()
                .orElse("Home & Living");
    }

    private double effectiveUnitPrice(Product product, ProductVariant variant) {
        double basePrice = product.getPromoPrice() != null && product.getPromoPrice() < product.getPrice()
                ? product.getPromoPrice()
                : product.getPrice();
        if (variant != null && variant.getPriceDelta() != null) {
            basePrice += variant.getPriceDelta();
        }
        return round(basePrice);
    }

    private String branchName(String department, String branch) {
        return department + " - " + branch;
    }

    private String leafName(String department, String branch, String leaf) {
        return branchName(department, branch) + " - " + leaf;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private List<SellerSeed> sellerSeeds() {
        return List.of(
                fashionSeller(),
                electronicsSeller(),
                homeSeller(),
                beautySeller(),
                sportsSeller(),
                kidsSeller(),
                booksSeller(),
                petSeller(),
                grocerySeller(),
                automotiveSeller()
        );
    }

    private SellerSeed fashionSeller() {
        return new SellerSeed(
                "seller@shopflow.com",
                "Ava",
                "Bennett",
                "Ava Luxury Store",
                "A contemporary boutique for polished occasionwear, elevated handbags, and refined accessories.",
                null,
                4.9,
                "Fashion",
                List.of(
                        new ProductSeed("Verona Satin Midi Dress", "Women's Wear", "Dresses", "evening events, weddings, and polished dinners", 189.0, 12, 14, 184, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Alder Trench Coat", "Women's Wear", "Outerwear", "transitional layering with clean tailoring", 249.0, 10, 9, 136, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Harper Leather Crossbody", "Accessories", "Bags", "hands-free daily wear with elevated hardware", 168.0, null, 18, 201, VariantProfile.ACCESSORY_FINISH),
                        new ProductSeed("Luna Pearl Drop Set", "Accessories", "Jewelry", "gift-ready styling with soft shine", 94.0, 8, 22, 148, VariantProfile.ACCESSORY_FINISH),
                        new ProductSeed("Marais Wool Wrap Coat", "Women's Wear", "Outerwear", "cold-season dressing with a luxe finish", 329.0, 15, 6, 121, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Solene Silk Halter Dress", "Women's Wear", "Dresses", "formal nights and destination celebrations", 214.0, null, 12, 167, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Portofino Leather Tote", "Accessories", "Bags", "workday carry with premium structure", 198.0, 10, 11, 224, VariantProfile.ACCESSORY_FINISH),
                        new ProductSeed("Atelier Signet Ring Stack", "Accessories", "Jewelry", "stackable styling and easy gifting", 72.0, null, 25, 133, VariantProfile.ACCESSORY_FINISH),
                        new ProductSeed("Riviera Pleated Evening Dress", "Women's Wear", "Dresses", "cocktail dressing with movement and shine", 224.0, 12, 8, 172, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Camden Cropped Blazer", "Women's Wear", "Outerwear", "smart layering for desk-to-dinner outfits", 179.0, null, 16, 142, VariantProfile.FASHION_SIZE),
                        new ProductSeed("Milan Chain Shoulder Bag", "Accessories", "Bags", "compact night-out carry with statement hardware", 152.0, 10, 13, 157, VariantProfile.ACCESSORY_FINISH),
                        new ProductSeed("Starlit Tennis Bracelet", "Accessories", "Jewelry", "minimal shine for gifting and occasion styling", 118.0, null, 4, 111, VariantProfile.ACCESSORY_FINISH)
                )
        );
    }

    private SellerSeed electronicsSeller() {
        return new SellerSeed(
                "seller1@shopflow.com",
                "Ethan",
                "Walker",
                "Volt & Pixel",
                "Workspace-ready tech, audio gear, and desk essentials chosen for performance and clean design.",
                null,
                4.8,
                "Electronics",
                List.of(
                        new ProductSeed("Nova ANC Wireless Headphones", "Audio", "Headphones", "commutes, focus sessions, and travel", 249.0, 14, 20, 311, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Echo Shelf Speaker Pair", "Audio", "Speakers", "compact rooms that still need full sound", 189.0, null, 14, 165, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Atlas 27-Inch 4K Display", "Workspace Tech", "Displays", "sharp creative work and daily multitasking", 429.0, 12, 7, 143, VariantProfile.DISPLAY_SIZE),
                        new ProductSeed("Relay Mechanical Keyboard", "Workspace Tech", "Peripherals", "quiet typing with tactile feedback", 129.0, 10, 24, 276, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Orbit USB-C Dock Station", "Workspace Tech", "Peripherals", "single-cable desk setups and laptop power users", 149.0, null, 18, 154, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Pulse Portable Bluetooth Speaker", "Audio", "Speakers", "poolside playlists and apartment listening", 119.0, 8, 22, 208, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Meridian Studio Headset", "Audio", "Headphones", "streaming, meetings, and low-latency calls", 169.0, null, 15, 187, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("FrameView 32-Inch Curved Monitor", "Workspace Tech", "Displays", "immersive desks and dual-window workflows", 489.0, 15, 6, 117, VariantProfile.DISPLAY_SIZE),
                        new ProductSeed("Raster Wireless Mouse", "Workspace Tech", "Peripherals", "all-day comfort and travel-friendly control", 74.0, null, 28, 241, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Signal Streaming Microphone", "Audio", "Speakers", "podcasts, calls, and content capture", 139.0, 10, 17, 171, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Halo Soundbar Mini", "Audio", "Speakers", "TV rooms that need cleaner speech and compact bass", 159.0, null, 12, 146, VariantProfile.ELECTRONICS_COLOR),
                        new ProductSeed("Vector Aluminum Laptop Stand", "Workspace Tech", "Peripherals", "ergonomic desk angles and cleaner airflow", 59.0, null, 5, 138, VariantProfile.ELECTRONICS_COLOR)
                )
        );
    }

    private SellerSeed homeSeller() {
        return new SellerSeed(
                "seller2@shopflow.com",
                "Nora",
                "Haddad",
                "Hearthline Living",
                "Layered textures, warm lighting, and practical furniture pieces for calm, modern homes.",
                null,
                4.8,
                "Home & Living",
                List.of(
                        new ProductSeed("Rowan Boucle Accent Chair", "Living Room", "Accent Furniture", "reading corners and conversation spaces", 389.0, 12, 5, 92, VariantProfile.HOME_FINISH),
                        new ProductSeed("Solis Brass Floor Lamp", "Living Room", "Lighting", "warm ambient corners and evening light", 214.0, null, 11, 133, VariantProfile.HOME_SIZE),
                        new ProductSeed("Mira Stoneware Dinner Set", "Kitchen & Dining", "Serveware", "host tables and everyday family dinners", 129.0, 10, 19, 188, VariantProfile.HOME_SIZE),
                        new ProductSeed("Alder Oak Coffee Table", "Living Room", "Accent Furniture", "grounding the room with clean lines", 298.0, null, 7, 104, VariantProfile.HOME_FINISH),
                        new ProductSeed("Ember Cast Iron Dutch Oven", "Kitchen & Dining", "Cookware", "slow braises, breads, and weekend cooking", 112.0, 8, 15, 201, VariantProfile.HOME_SIZE),
                        new ProductSeed("Tidal Glass Carafe Set", "Kitchen & Dining", "Serveware", "polished table service and easy entertaining", 74.0, null, 24, 164, VariantProfile.HOME_SIZE),
                        new ProductSeed("Lumen Linen Table Lamp", "Living Room", "Lighting", "soft bedside and console lighting", 96.0, null, 17, 172, VariantProfile.HOME_SIZE),
                        new ProductSeed("Haven Walnut Console", "Living Room", "Accent Furniture", "entryways and slim-profile display styling", 256.0, 10, 8, 99, VariantProfile.HOME_FINISH),
                        new ProductSeed("Cedar Marble Serving Board", "Kitchen & Dining", "Serveware", "casual hosting with a clean premium finish", 62.0, null, 20, 153, VariantProfile.HOME_FINISH),
                        new ProductSeed("Arc Ceramic Pendant Light", "Living Room", "Lighting", "statement lighting above dining and island spaces", 178.0, 12, 9, 112, VariantProfile.HOME_SIZE),
                        new ProductSeed("Verona Nonstick Fry Pan", "Kitchen & Dining", "Cookware", "fast weekday cooking with even heat", 86.0, null, 18, 214, VariantProfile.HOME_SIZE),
                        new ProductSeed("Woven Basket Side Table", "Living Room", "Accent Furniture", "small-space styling with hidden storage", 98.0, null, 4, 128, VariantProfile.HOME_FINISH)
                )
        );
    }

    private SellerSeed beautySeller() {
        return new SellerSeed(
                "seller3@shopflow.com",
                "Lina",
                "Salem",
                "PureSkin Lab",
                "Skincare and haircare essentials focused on texture, routine simplicity, and visible results.",
                null,
                4.7,
                "Beauty",
                List.of(
                        new ProductSeed("Cloud Dew Hyaluronic Serum", "Skincare", "Serums", "dehydrated skin and lightweight layering", 42.0, 10, 36, 274, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Barrier Repair Cream", "Skincare", "Moisturizers", "dry skin support and winter routines", 36.0, null, 28, 246, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Root Reset Clarifying Shampoo", "Haircare", "Shampoo & Treatment", "weekly reset wash without stripping", 28.0, null, 34, 199, VariantProfile.BEAUTY_SCENT),
                        new ProductSeed("Silk Finish Thermal Brush", "Haircare", "Styling Tools", "quick smoothing and soft bend styling", 79.0, 12, 11, 141, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Vitamin C Brightening Drops", "Skincare", "Serums", "dull skin and AM glow routines", 48.0, 10, 25, 233, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Overnight Recovery Mask", "Skincare", "Moisturizers", "deep overnight hydration and calm texture", 39.0, null, 22, 187, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Restore Bond Treatment", "Haircare", "Shampoo & Treatment", "heat-stressed or colored hair support", 33.0, 8, 26, 176, VariantProfile.BEAUTY_SCENT),
                        new ProductSeed("Ceramic Ionic Styling Wand", "Haircare", "Styling Tools", "soft waves and fast salon-style finish", 88.0, null, 10, 132, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Calm Water Gel Moisturizer", "Skincare", "Moisturizers", "light daily hydration for combination skin", 32.0, null, 31, 208, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Peptide Firming Serum", "Skincare", "Serums", "night routines focused on bounce and smoothness", 56.0, 12, 19, 159, VariantProfile.BEAUTY_SIZE),
                        new ProductSeed("Scalp Balance Exfoliating Wash", "Haircare", "Shampoo & Treatment", "build-up removal and refreshed roots", 31.0, null, 27, 144, VariantProfile.BEAUTY_SCENT),
                        new ProductSeed("AirLift Diffuser Dryer", "Haircare", "Styling Tools", "curl-friendly drying with frizz control", 129.0, 10, 5, 118, VariantProfile.BEAUTY_SIZE)
                )
        );
    }

    private SellerSeed sportsSeller() {
        return new SellerSeed(
                "seller4@shopflow.com",
                "Omar",
                "Reed",
                "Summit Outdoors",
                "Training gear and outdoor kits selected for durability, portability, and repeated use.",
                null,
                4.8,
                "Sports",
                List.of(
                        new ProductSeed("Granite Grip Kettlebell 16kg", "Training", "Strength Gear", "compact home gyms and full-body sessions", 74.0, null, 16, 239, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Ridge Trail Daypack", "Outdoor Adventure", "Camping", "day hikes and organized weekend packing", 92.0, 10, 14, 188, VariantProfile.SPORTS_PACK),
                        new ProductSeed("Flow Cork Yoga Mat", "Training", "Yoga & Recovery", "studio sessions with extra grip and cushioning", 58.0, null, 21, 264, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Northline Camping Lantern", "Outdoor Adventure", "Camping", "tent lighting and power outage backup", 46.0, null, 28, 174, VariantProfile.SPORTS_PACK),
                        new ProductSeed("Apex Resistance Band Kit", "Training", "Strength Gear", "portable training and rehab routines", 39.0, 8, 26, 221, VariantProfile.SPORTS_PACK),
                        new ProductSeed("VeloShield Road Helmet", "Outdoor Adventure", "Cycling", "daily rides and weekend training miles", 84.0, 10, 12, 165, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Summit Recovery Roller", "Training", "Yoga & Recovery", "post-workout mobility and tension release", 34.0, null, 25, 197, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Alpine Two-Person Tent", "Outdoor Adventure", "Camping", "quick setup weekend camping", 159.0, 12, 7, 126, VariantProfile.SPORTS_PACK),
                        new ProductSeed("Stride Hydration Vest", "Outdoor Adventure", "Cycling", "long runs and hot-weather rides", 96.0, null, 13, 149, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Forge Adjustable Dumbbells", "Training", "Strength Gear", "progressive strength work in small spaces", 269.0, 15, 4, 111, VariantProfile.SPORTS_SIZE),
                        new ProductSeed("Cascade Sleeping Pad", "Outdoor Adventure", "Camping", "lightweight overnight comfort and insulation", 72.0, null, 15, 138, VariantProfile.SPORTS_PACK),
                        new ProductSeed("Terrain Bike Floor Pump", "Outdoor Adventure", "Cycling", "garage tune-ups and fast pressure checks", 54.0, null, 9, 132, VariantProfile.SPORTS_PACK)
                )
        );
    }

    private SellerSeed kidsSeller() {
        return new SellerSeed(
                "seller5@shopflow.com",
                "Maya",
                "Grant",
                "Playfield Kids",
                "Play-led learning products, nursery essentials, and gifting staples for growing families.",
                null,
                4.7,
                "Kids & Toys",
                List.of(
                        new ProductSeed("Orbit Magnetic Builder Set", "Learning Play", "STEM Toys", "open-ended building and problem solving", 46.0, null, 24, 251, VariantProfile.KIDS_AGE),
                        new ProductSeed("Little Makers Art Caddy", "Learning Play", "Arts & Crafts", "mess-friendly creative afternoons", 34.0, 8, 18, 179, VariantProfile.KIDS_AGE),
                        new ProductSeed("Cloud Silicone Bento Box", "Baby & Nursery", "Feeding", "easy packed lunches and snack organization", 24.0, null, 31, 162, VariantProfile.KIDS_AGE),
                        new ProductSeed("Moonbeam Nursery Lamp", "Baby & Nursery", "Room Decor", "soft bedtime routines and calming spaces", 58.0, 10, 14, 118, VariantProfile.KIDS_AGE),
                        new ProductSeed("Junior Coding Rover", "Learning Play", "STEM Toys", "screen-light logic play and movement", 79.0, null, 13, 143, VariantProfile.KIDS_AGE),
                        new ProductSeed("Washable Poster Paint Set", "Learning Play", "Arts & Crafts", "classroom-safe color play and cleanup", 22.0, null, 28, 194, VariantProfile.KIDS_AGE),
                        new ProductSeed("Meadow Suction Plate Trio", "Baby & Nursery", "Feeding", "less-mess mealtimes and durable everyday use", 29.0, 8, 22, 171, VariantProfile.KIDS_AGE),
                        new ProductSeed("Storytime Plush Reading Nook", "Baby & Nursery", "Room Decor", "cozy corners for books and quiet play", 94.0, 10, 8, 101, VariantProfile.KIDS_AGE),
                        new ProductSeed("Puzzle Path Logic Tiles", "Learning Play", "STEM Toys", "solo play with pattern and sequencing", 31.0, null, 25, 184, VariantProfile.KIDS_AGE),
                        new ProductSeed("Craft Club Sticker Studio", "Learning Play", "Arts & Crafts", "portable making and screen-free gifting", 27.0, null, 19, 153, VariantProfile.KIDS_AGE),
                        new ProductSeed("Snuggle Cotton Swaddle Set", "Baby & Nursery", "Feeding", "soft daily baby routines and gifting", 38.0, 10, 16, 127, VariantProfile.KIDS_AGE),
                        new ProductSeed("Rainbow Growth Chart", "Baby & Nursery", "Room Decor", "playful walls and keepsake moments", 42.0, null, 5, 115, VariantProfile.KIDS_AGE)
                )
        );
    }

    private SellerSeed booksSeller() {
        return new SellerSeed(
                "seller6@shopflow.com",
                "Daniel",
                "Nash",
                "Paper Finch",
                "Beautiful reading editions and desk tools for focused work, gifting, and everyday planning.",
                null,
                4.8,
                "Books & Stationery",
                List.of(
                        new ProductSeed("Midnight Harbor: A Novel", "Reading", "Fiction", "curl-up evenings and gift tables", 24.0, null, 32, 144, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Design Systems Field Guide", "Reading", "Non-Fiction", "product teams and organized creative workflows", 42.0, 10, 20, 108, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Daily Focus Linen Planner", "Desk Setup", "Journals", "structured weekly planning and note capture", 28.0, null, 29, 261, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Brass Grid Desk Organizer", "Desk Setup", "Office Tools", "tidy desk surfaces and better reach", 39.0, null, 17, 173, VariantProfile.DESK_COLOR),
                        new ProductSeed("The Quiet Department", "Reading", "Fiction", "slow-burn literary reading and shelf styling", 22.0, null, 24, 119, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Creative Strategy Workbook", "Reading", "Non-Fiction", "facilitated workshops and solo planning sessions", 34.0, 8, 18, 131, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Softcover Dot Journal Set", "Desk Setup", "Journals", "meeting notes, journaling, and desk gifting", 26.0, null, 26, 214, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Precision Gel Pen Trio", "Desk Setup", "Office Tools", "smooth daily writing and desk upgrades", 18.0, null, 33, 204, VariantProfile.DESK_COLOR),
                        new ProductSeed("Atlas of Small Adventures", "Reading", "Non-Fiction", "coffee table browsing and trip dreaming", 31.0, 10, 21, 117, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Notes on Slow Living", "Reading", "Fiction", "gift bundles and reflective reading time", 20.0, null, 22, 124, VariantProfile.BOOK_FORMAT),
                        new ProductSeed("Walnut Monitor Riser", "Desk Setup", "Office Tools", "better posture and a cleaner desk silhouette", 68.0, 12, 9, 96, VariantProfile.DESK_COLOR),
                        new ProductSeed("Weekly Desk Pad", "Desk Setup", "Journals", "quick planning and visible to-do tracking", 19.0, null, 5, 182, VariantProfile.BOOK_FORMAT)
                )
        );
    }

    private SellerSeed petSeller() {
        return new SellerSeed(
                "seller7@shopflow.com",
                "Sofia",
                "Turner",
                "Pet Harbor",
                "Well-made everyday essentials for pets, from rest and travel to feeding and enrichment.",
                null,
                4.8,
                "Pet Supplies",
                List.of(
                        new ProductSeed("Harbor Orthopedic Dog Bed", "Dog Care", "Beds & Travel", "larger breeds and older dogs needing support", 96.0, 10, 14, 183, VariantProfile.PET_SIZE),
                        new ProductSeed("Rover Trail Travel Crate", "Dog Care", "Beds & Travel", "road trips and secure in-car transport", 148.0, null, 8, 121, VariantProfile.PET_SIZE),
                        new ProductSeed("TugTime Rope Toy Pack", "Dog Care", "Toys", "active play and durable chew sessions", 24.0, null, 30, 212, VariantProfile.PET_PACK),
                        new ProductSeed("Whisker Ceramic Feeding Station", "Cat Care", "Feeding", "elevated bowls and cleaner feeding routines", 52.0, 8, 18, 157, VariantProfile.PET_SIZE),
                        new ProductSeed("Cedar Cat Climbing Post", "Cat Care", "Scratchers", "vertical scratching and apartment enrichment", 88.0, 12, 10, 146, VariantProfile.PET_SIZE),
                        new ProductSeed("CalmPaws Lick Mat", "Dog Care", "Toys", "slow feeding and grooming distraction", 16.0, null, 34, 208, VariantProfile.PET_PACK),
                        new ProductSeed("Seaside Waterproof Lead Set", "Dog Care", "Beds & Travel", "messy-weather walks and easy cleanup", 34.0, null, 22, 173, VariantProfile.PET_PACK),
                        new ProductSeed("Feather Dash Teaser Wand", "Cat Care", "Scratchers", "quick interactive play for indoor cats", 18.0, null, 28, 191, VariantProfile.PET_PACK),
                        new ProductSeed("Elevated Birch Bowl Stand", "Cat Care", "Feeding", "tidier feeding setups and cleaner floors", 46.0, 10, 16, 134, VariantProfile.PET_SIZE),
                        new ProductSeed("Window Hammock Lounger", "Cat Care", "Scratchers", "sunny nap spots and compact apartment setups", 39.0, null, 17, 128, VariantProfile.PET_SIZE),
                        new ProductSeed("Training Treat Pouch", "Dog Care", "Toys", "walks, recall work, and easy reward access", 19.0, null, 24, 162, VariantProfile.PET_PACK),
                        new ProductSeed("Sisal Corner Scratch Ramp", "Cat Care", "Scratchers", "space-saving scratching without bulky furniture", 44.0, null, 5, 117, VariantProfile.PET_SIZE)
                )
        );
    }

    private SellerSeed grocerySeller() {
        return new SellerSeed(
                "seller8@shopflow.com",
                "Karim",
                "Mansour",
                "Pantry Lane",
                "Shelf-stable gourmet staples, coffee, tea, and gift-ready pantry upgrades.",
                null,
                4.7,
                "Grocery & Gourmet",
                List.of(
                        new ProductSeed("Atlas Roast Coffee Beans", "Pantry", "Coffee & Tea", "daily brews with rich chocolate notes", 18.0, null, 40, 286, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Citrus Grove Extra Virgin Olive Oil", "Pantry", "Olive Oil & Vinegar", "bright finishing and everyday cooking", 24.0, 8, 26, 174, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Monsoon Masala Chai Tin", "Pantry", "Coffee & Tea", "warming tea service and gifting", 16.0, null, 34, 192, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Sea Salt Dark Chocolate Squares", "Snacking", "Chocolate", "desk treats and after-dinner bites", 14.0, null, 42, 218, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Barrel-Aged Balsamic Reserve", "Pantry", "Olive Oil & Vinegar", "cheese boards and finishing drizzle", 22.0, null, 27, 161, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Breakfast Pantry Gift Box", "Snacking", "Gift Boxes", "easy host gifts and brunch-themed bundles", 48.0, 10, 15, 107, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Bloom Jasmine Green Tea", "Pantry", "Coffee & Tea", "light afternoon cups and reset routines", 15.0, null, 33, 166, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Sicilian Lemon Olive Oil", "Pantry", "Olive Oil & Vinegar", "roasted vegetables and quick dressings", 21.0, null, 24, 149, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Roasted Hazelnut Truffle Box", "Snacking", "Chocolate", "small gifts and celebratory dessert tables", 19.0, 8, 29, 178, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Mediterranean Tapas Gift Crate", "Snacking", "Gift Boxes", "shared grazing tables and client gifting", 64.0, 10, 9, 98, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Espresso Blend Capsules", "Pantry", "Coffee & Tea", "fast mornings and consistent espresso shots", 17.0, null, 37, 204, VariantProfile.GROCERY_PACK),
                        new ProductSeed("Smoked Chili Olive Oil", "Pantry", "Olive Oil & Vinegar", "finishing pizza, eggs, and grilled vegetables", 23.0, null, 5, 141, VariantProfile.GROCERY_PACK)
                )
        );
    }

    private SellerSeed automotiveSeller() {
        return new SellerSeed(
                "seller9@shopflow.com",
                "Rania",
                "Keller",
                "Garage District",
                "Garage-ready tools and car care kits that stay organized and hold up under real use.",
                null,
                4.8,
                "Automotive & Tools",
                List.of(
                        new ProductSeed("TorqueMax Cordless Drill", "Garage Tools", "Power Tools", "quick home fixes and shelf installs", 139.0, 10, 13, 176, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Precision Ratchet Socket Set", "Garage Tools", "Hand Tools", "weekend maintenance and compact tool drawers", 88.0, null, 19, 153, VariantProfile.TOOLS_KIT),
                        new ProductSeed("RoadReady Emergency Battery Pack", "Car Care", "Emergency Kits", "dead batteries, roadside prep, and glovebox backup", 124.0, 12, 12, 148, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Leather Guard Interior Kit", "Car Care", "Interior Care", "seat cleanup and leather maintenance", 46.0, null, 26, 194, VariantProfile.TOOLS_KIT),
                        new ProductSeed("SteelCore Impact Driver", "Garage Tools", "Power Tools", "fasteners, cabinets, and repeated project work", 169.0, 10, 10, 137, VariantProfile.TOOLS_KIT),
                        new ProductSeed("FlexGrip Hex Key Bundle", "Garage Tools", "Hand Tools", "bike tuning and compact bench drawers", 29.0, null, 34, 188, VariantProfile.TOOLS_KIT),
                        new ProductSeed("All-Weather Trunk Organizer", "Car Care", "Emergency Kits", "cargo control and family road trips", 42.0, null, 21, 167, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Ceramic Wash & Wax Duo", "Car Care", "Interior Care", "quick shine maintenance and easy detailing", 36.0, 8, 28, 201, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Workshop Magnetic Light Bar", "Garage Tools", "Power Tools", "under-hood work and dim garage corners", 54.0, null, 18, 143, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Compact Tire Inflator", "Car Care", "Emergency Kits", "roadside top-offs and garage prep", 62.0, 10, 17, 159, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Microfiber Detailing Towel Pack", "Car Care", "Interior Care", "streak-free wiping and easy repeat washing", 19.0, null, 30, 223, VariantProfile.TOOLS_KIT),
                        new ProductSeed("Trailside Safety Kit", "Car Care", "Emergency Kits", "long drives and glove compartment peace of mind", 58.0, null, 5, 129, VariantProfile.TOOLS_KIT)
                )
        );
    }

    private List<CustomerSeed> customerSeeds() {
        return List.of(
                new CustomerSeed("customer@shopflow.com", "Liam", "Customer"),
                new CustomerSeed("customer1@shopflow.com", "Aiden", "Cole"),
                new CustomerSeed("customer2@shopflow.com", "Chloe", "Diaz"),
                new CustomerSeed("customer3@shopflow.com", "Yara", "Ben Ali"),
                new CustomerSeed("customer4@shopflow.com", "Samir", "Farouk"),
                new CustomerSeed("customer5@shopflow.com", "Emma", "Grant"),
                new CustomerSeed("customer6@shopflow.com", "Jonas", "Nash"),
                new CustomerSeed("customer7@shopflow.com", "Mila", "Santos"),
                new CustomerSeed("customer8@shopflow.com", "Noah", "Baker"),
                new CustomerSeed("customer9@shopflow.com", "Layla", "Haddad"),
                new CustomerSeed("customer10@shopflow.com", "Rayan", "Mokhtar"),
                new CustomerSeed("customer11@shopflow.com", "Sophie", "Turner")
        );
    }

    private List<DepartmentSeed> departmentSeeds() {
        return List.of(
                new DepartmentSeed("Fashion", "Modern apparel and accessories for everyday polish and special occasions.", List.of(
                        new CategoryBranchSeed("Women's Wear", "Wardrobe foundations, outerwear, and event-ready pieces.", List.of(
                                new CategoryLeafSeed("Dresses", "Dresses for work, events, and elevated everyday styling."),
                                new CategoryLeafSeed("Outerwear", "Tailored coats, jackets, and seasonal layers.")
                        )),
                        new CategoryBranchSeed("Accessories", "Bags and jewelry designed to finish the look.", List.of(
                                new CategoryLeafSeed("Bags", "Crossbodies, totes, and shoulder bags."),
                                new CategoryLeafSeed("Jewelry", "Giftable pieces with modern finishes.")
                        ))
                )),
                new DepartmentSeed("Electronics", "Audio devices and workspace hardware for focused, connected setups.", List.of(
                        new CategoryBranchSeed("Audio", "Listening gear for home, travel, and entertainment.", List.of(
                                new CategoryLeafSeed("Headphones", "Wireless, over-ear, and studio-style listening."),
                                new CategoryLeafSeed("Speakers", "Portable and shelf-friendly speaker systems.")
                        )),
                        new CategoryBranchSeed("Workspace Tech", "Desk tech for home offices and creative stations.", List.of(
                                new CategoryLeafSeed("Displays", "Monitors and visual workspace upgrades."),
                                new CategoryLeafSeed("Peripherals", "Keyboards, mice, docks, and accessories.")
                        ))
                )),
                new DepartmentSeed("Home & Living", "Furniture, lighting, and kitchen pieces that make rooms feel finished.", List.of(
                        new CategoryBranchSeed("Living Room", "Statement pieces and ambient light for social spaces.", List.of(
                                new CategoryLeafSeed("Accent Furniture", "Tables, chairs, and storage with presence."),
                                new CategoryLeafSeed("Lighting", "Floor, table, and pendant lighting.")
                        )),
                        new CategoryBranchSeed("Kitchen & Dining", "Cookware and serveware for daily use and hosting.", List.of(
                                new CategoryLeafSeed("Cookware", "Pantry-to-table tools for home cooking."),
                                new CategoryLeafSeed("Serveware", "Trays, boards, and dinner table essentials.")
                        ))
                )),
                new DepartmentSeed("Beauty", "High-rotation skincare and haircare products with premium textures.", List.of(
                        new CategoryBranchSeed("Skincare", "Treatments and moisturizers for simple repeatable routines.", List.of(
                                new CategoryLeafSeed("Serums", "Targeted formulas for brightness and hydration."),
                                new CategoryLeafSeed("Moisturizers", "Daily creams, masks, and barrier support.")
                        )),
                        new CategoryBranchSeed("Haircare", "Wash-day and styling companions.", List.of(
                                new CategoryLeafSeed("Shampoo & Treatment", "Cleansing, repair, and scalp care."),
                                new CategoryLeafSeed("Styling Tools", "Brushes and tools for polished finishes.")
                        ))
                )),
                new DepartmentSeed("Sports", "Fitness and outdoor gear built to travel, train, and recover hard.", List.of(
                        new CategoryBranchSeed("Training", "Essentials for home workouts and recovery days.", List.of(
                                new CategoryLeafSeed("Yoga & Recovery", "Mobility, stretch, and recovery gear."),
                                new CategoryLeafSeed("Strength Gear", "Core strength tools and resistance equipment.")
                        )),
                        new CategoryBranchSeed("Outdoor Adventure", "Portable gear for rides, hikes, and overnight trips.", List.of(
                                new CategoryLeafSeed("Camping", "Lighting, shelter, and sleep system basics."),
                                new CategoryLeafSeed("Cycling", "Ride-ready helmets, pumps, and accessories.")
                        ))
                )),
                new DepartmentSeed("Kids & Toys", "Playful learning tools and family-friendly essentials.", List.of(
                        new CategoryBranchSeed("Learning Play", "Screen-light activities that keep kids engaged.", List.of(
                                new CategoryLeafSeed("STEM Toys", "Hands-on building, logic, and discovery toys."),
                                new CategoryLeafSeed("Arts & Crafts", "Creative kits for making and coloring.")
                        )),
                        new CategoryBranchSeed("Baby & Nursery", "Soft goods and routine helpers for home and gifting.", List.of(
                                new CategoryLeafSeed("Feeding", "Lunch, snack, and meal-time essentials."),
                                new CategoryLeafSeed("Room Decor", "Lamps and decor for calm nursery spaces.")
                        ))
                )),
                new DepartmentSeed("Books & Stationery", "Reading picks and desk tools that make work feel intentional.", List.of(
                        new CategoryBranchSeed("Reading", "Shelf-worthy editions for leisure and learning.", List.of(
                                new CategoryLeafSeed("Fiction", "Novels and giftable literary picks."),
                                new CategoryLeafSeed("Non-Fiction", "Guides, essays, and practical reads.")
                        )),
                        new CategoryBranchSeed("Desk Setup", "Organizers and paper goods for focused work.", List.of(
                                new CategoryLeafSeed("Journals", "Planners, pads, and everyday notebooks."),
                                new CategoryLeafSeed("Office Tools", "Desk accessories that clean up the workspace.")
                        ))
                )),
                new DepartmentSeed("Pet Supplies", "Pet comfort, enrichment, and mealtime essentials.", List.of(
                        new CategoryBranchSeed("Dog Care", "Gear for rest, transport, and active play.", List.of(
                                new CategoryLeafSeed("Beds & Travel", "Beds, leads, and portable comfort."),
                                new CategoryLeafSeed("Toys", "Play and reward tools for active routines.")
                        )),
                        new CategoryBranchSeed("Cat Care", "Feeding and enrichment for indoor cats.", List.of(
                                new CategoryLeafSeed("Feeding", "Bowls, stands, and mealtime upgrades."),
                                new CategoryLeafSeed("Scratchers", "Scratch surfaces and climbing add-ons.")
                        ))
                )),
                new DepartmentSeed("Grocery & Gourmet", "Shelf-stable pantry upgrades, treats, and gift-ready food items.", List.of(
                        new CategoryBranchSeed("Pantry", "Daily staples and elevated ingredients.", List.of(
                                new CategoryLeafSeed("Coffee & Tea", "Beans, blends, and tea tins."),
                                new CategoryLeafSeed("Olive Oil & Vinegar", "Finishing oils and pantry flavor boosters.")
                        )),
                        new CategoryBranchSeed("Snacking", "Treats and shareable gift boxes.", List.of(
                                new CategoryLeafSeed("Chocolate", "Bars, truffles, and snackable sweets."),
                                new CategoryLeafSeed("Gift Boxes", "Curated edible gifting sets.")
                        ))
                )),
                new DepartmentSeed("Automotive & Tools", "Home garage equipment and vehicle care kits with solid build quality.", List.of(
                        new CategoryBranchSeed("Garage Tools", "Everyday tool sets for repairs and assembly.", List.of(
                                new CategoryLeafSeed("Power Tools", "Drills, drivers, and powered workshop staples."),
                                new CategoryLeafSeed("Hand Tools", "Socket sets, keys, and compact mechanics tools.")
                        )),
                        new CategoryBranchSeed("Car Care", "Preparedness and detailing essentials.", List.of(
                                new CategoryLeafSeed("Interior Care", "Detailing, cleaning, and protection kits."),
                                new CategoryLeafSeed("Emergency Kits", "Roadside support and trunk-ready prep.")
                        ))
                )),
                new DepartmentSeed("Other", "A general category for listings that do not fit an existing ShopFlow department.", List.of())
        );
    }

    private enum VariantProfile {
        FASHION_SIZE,
        ACCESSORY_FINISH,
        ELECTRONICS_COLOR,
        DISPLAY_SIZE,
        HOME_FINISH,
        HOME_SIZE,
        BEAUTY_SIZE,
        BEAUTY_SCENT,
        SPORTS_SIZE,
        SPORTS_PACK,
        KIDS_AGE,
        BOOK_FORMAT,
        DESK_COLOR,
        PET_SIZE,
        PET_PACK,
        GROCERY_PACK,
        TOOLS_KIT
    }

    private record CouponSeed(String code,
                              CouponType type,
                              double value,
                              double minOrderAmount,
                              int maxUsages,
                              int currentUsages,
                              boolean active) {
    }

    private record SellerSeed(String email,
                              String firstName,
                              String lastName,
                              String shopName,
                              String description,
                              String logoUrl,
                              double rating,
                              String department,
                              List<ProductSeed> products) {
    }

    private record CustomerSeed(String email, String firstName, String lastName) {
    }

    private record ProductSeed(String name,
                               String section,
                               String leaf,
                               String summary,
                               double price,
                               Integer promoPercent,
                               int stock,
                               long salesCount,
                               VariantProfile variantProfile) {
    }

    private record ProductMediaSeed(String sourceTags, List<String> urls) {
    }

    private record DepartmentSeed(String name, String description, List<CategoryBranchSeed> branches) {
    }

    private record CategoryBranchSeed(String name, String description, List<CategoryLeafSeed> leaves) {
    }

    private record CategoryLeafSeed(String name, String description) {
    }
}
