package com.shopflow.config;

import com.shopflow.entities.*;
import com.shopflow.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
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
            Map.entry("Verona Satin Midi Dress", productMedia("satin,dress,women", 620000)),
            Map.entry("Alder Trench Coat", productMedia("trench,coat", 620010)),
            Map.entry("Harper Leather Crossbody", productMedia("crossbody,bag", 620020)),
            Map.entry("Luna Pearl Drop Set", productMedia("pearl,earrings", 620030)),
            Map.entry("Marais Wool Wrap Coat", productMedia("wool,coat,women", 620040)),
            Map.entry("Solene Silk Halter Dress", productMedia("silk,dress,women", 620050)),
            Map.entry("Portofino Leather Tote", productMedia("leather,tote,bag", 620060)),
            Map.entry("Atelier Signet Ring Stack", productMedia("signet,ring,jewelry", 620070)),
            Map.entry("Riviera Pleated Evening Dress", productMedia("dress,women", 620080)),
            Map.entry("Camden Cropped Blazer", productMedia("blazer,women", 620090)),
            Map.entry("Milan Chain Shoulder Bag", productMedia("shoulder,bag", 620100)),
            Map.entry("Starlit Tennis Bracelet", productMedia("bracelet,jewelry", 620110)),
            Map.entry("Nova ANC Wireless Headphones", productMedia("wireless,headphones", 620120)),
            Map.entry("Echo Shelf Speaker Pair", productMedia("bookshelf,speaker", 620130)),
            Map.entry("Atlas 27-Inch 4K Display", productMedia("monitor,screen", 620140)),
            Map.entry("Relay Mechanical Keyboard", productMedia("mechanical,keyboard", 620150)),
            Map.entry("Orbit USB-C Dock Station", productMedia("usb,c,hub", 620160)),
            Map.entry("Pulse Portable Bluetooth Speaker", productMedia("bluetooth,speaker", 620170)),
            Map.entry("Meridian Studio Headset", productMedia("gaming,headset", 620180)),
            Map.entry("FrameView 32-Inch Curved Monitor", productMedia("curved,monitor", 620190)),
            Map.entry("Raster Wireless Mouse", productMedia("wireless,mouse", 620200)),
            Map.entry("Signal Streaming Microphone", productMedia("streaming,microphone", 620210)),
            Map.entry("Halo Soundbar Mini", productMedia("soundbar,speaker", 620220)),
            Map.entry("Vector Aluminum Laptop Stand", productMedia("laptop,stand", 620230)),
            Map.entry("Rowan Boucle Accent Chair", productMedia("accent,chair", 620240)),
            Map.entry("Solis Brass Floor Lamp", productMedia("floor,lamp", 620250)),
            Map.entry("Mira Stoneware Dinner Set", productMedia("dinnerware,set", 620260)),
            Map.entry("Alder Oak Coffee Table", productMedia("coffee,table", 620270)),
            Map.entry("Ember Cast Iron Dutch Oven", productMedia("dutch,oven", 620280)),
            Map.entry("Tidal Glass Carafe Set", productMedia("glass,carafe", 620290)),
            Map.entry("Lumen Linen Table Lamp", productMedia("table,lamp", 620300)),
            Map.entry("Haven Walnut Console", productMedia("console,table", 620310)),
            Map.entry("Cedar Marble Serving Board", productMedia("serving,board", 620320)),
            Map.entry("Arc Ceramic Pendant Light", productMedia("pendant,light", 620330)),
            Map.entry("Verona Nonstick Fry Pan", productMedia("frying,pan", 620340)),
            Map.entry("Woven Basket Side Table", productMedia("basket,table", 620350)),
            Map.entry("Cloud Dew Hyaluronic Serum", productMedia("serum", 620360)),
            Map.entry("Barrier Repair Cream", productMedia("cream,jar", 620370)),
            Map.entry("Root Reset Clarifying Shampoo", productMedia("shampoo,bottle", 620380)),
            Map.entry("Silk Finish Thermal Brush", productMedia("hair,brush", 620390)),
            Map.entry("Vitamin C Brightening Drops", productMedia("skincare,bottle", 620400)),
            Map.entry("Overnight Recovery Mask", productMedia("face,mask,jar", 620410)),
            Map.entry("Restore Bond Treatment", productMedia("hair,treatment", 620420)),
            Map.entry("Ceramic Ionic Styling Wand", productMedia("curling,iron", 620430)),
            Map.entry("Calm Water Gel Moisturizer", productMedia("cosmetics", 620440)),
            Map.entry("Peptide Firming Serum", productMedia("beauty,serum", 620450)),
            Map.entry("Scalp Balance Exfoliating Wash", productMedia("shampoo,bottle", 620460)),
            Map.entry("AirLift Diffuser Dryer", productMedia("hair,dryer", 620470)),
            Map.entry("Granite Grip Kettlebell 16kg", productMedia("kettlebell", 620480)),
            Map.entry("Ridge Trail Daypack", productMedia("hiking,daypack", 620490)),
            Map.entry("Flow Cork Yoga Mat", productMedia("yoga,mat", 620500)),
            Map.entry("Northline Camping Lantern", productMedia("camping,lantern", 620510)),
            Map.entry("Apex Resistance Band Kit", productMedia("resistance,bands", 620520)),
            Map.entry("VeloShield Road Helmet", productMedia("cycling,helmet", 620530)),
            Map.entry("Summit Recovery Roller", productMedia("foam,roller", 620540)),
            Map.entry("Alpine Two-Person Tent", productMedia("tent", 620550)),
            Map.entry("Stride Hydration Vest", productMedia("running,vest", 620560)),
            Map.entry("Forge Adjustable Dumbbells", productMedia("dumbbells", 620570)),
            Map.entry("Cascade Sleeping Pad", productMedia("sleeping,pad", 620580)),
            Map.entry("Terrain Bike Floor Pump", productMedia("bike,pump", 620590)),
            Map.entry("Orbit Magnetic Builder Set", productMedia("blocks,toy", 620600)),
            Map.entry("Little Makers Art Caddy", productMedia("art,supplies", 620610)),
            Map.entry("Cloud Silicone Bento Box", productMedia("bento,box", 620620)),
            Map.entry("Moonbeam Nursery Lamp", productMedia("nursery,lamp", 620630)),
            Map.entry("Junior Coding Rover", productMedia("robot,toy", 620640)),
            Map.entry("Washable Poster Paint Set", productMedia("paint,set", 620650)),
            Map.entry("Meadow Suction Plate Trio", productMedia("baby,plate", 620660)),
            Map.entry("Storytime Plush Reading Nook", productMedia("reading,nook", 620670)),
            Map.entry("Puzzle Path Logic Tiles", productMedia("puzzle,tiles", 620680)),
            Map.entry("Craft Club Sticker Studio", productMedia("sticker,craft", 620690)),
            Map.entry("Snuggle Cotton Swaddle Set", productMedia("baby,swaddle", 620700)),
            Map.entry("Rainbow Growth Chart", productMedia("growth,chart", 620710)),
            Map.entry("Midnight Harbor: A Novel", productMedia("novel,book", 620720)),
            Map.entry("Design Systems Field Guide", productMedia("design,book", 620730)),
            Map.entry("Daily Focus Linen Planner", productMedia("planner,notebook", 620740)),
            Map.entry("Brass Grid Desk Organizer", productMedia("desk,organizer", 620750)),
            Map.entry("The Quiet Department", productMedia("fiction,book", 620760)),
            Map.entry("Creative Strategy Workbook", productMedia("workbook,notebook", 620770)),
            Map.entry("Softcover Dot Journal Set", productMedia("journal", 620780)),
            Map.entry("Precision Gel Pen Trio", productMedia("gel,pens", 620790)),
            Map.entry("Atlas of Small Adventures", productMedia("travel,book", 620800)),
            Map.entry("Notes on Slow Living", productMedia("lifestyle,book", 620810)),
            Map.entry("Walnut Monitor Riser", productMedia("monitor,stand", 620820)),
            Map.entry("Weekly Desk Pad", productMedia("desk,pad", 620830)),
            Map.entry("Harbor Orthopedic Dog Bed", productMedia("dog,bed", 620840)),
            Map.entry("Rover Trail Travel Crate", productMedia("dog,crate", 620850)),
            Map.entry("TugTime Rope Toy Pack", productMedia("rope,dog,toy", 620860)),
            Map.entry("Whisker Ceramic Feeding Station", productMedia("pet,bowls", 620870)),
            Map.entry("Cedar Cat Climbing Post", productMedia("cat,scratching,post", 620880)),
            Map.entry("CalmPaws Lick Mat", productMedia("dog,mat", 620890)),
            Map.entry("Seaside Waterproof Lead Set", productMedia("dog,leash", 620900)),
            Map.entry("Feather Dash Teaser Wand", productMedia("cat,toy", 620910)),
            Map.entry("Elevated Birch Bowl Stand", productMedia("pet,bowls", 620920)),
            Map.entry("Window Hammock Lounger", productMedia("cat,hammock", 620930)),
            Map.entry("Training Treat Pouch", productMedia("treat,bag", 620940)),
            Map.entry("Sisal Corner Scratch Ramp", productMedia("cat,scratcher", 620950)),
            Map.entry("Atlas Roast Coffee Beans", productMedia("coffee,beans", 620960)),
            Map.entry("Citrus Grove Extra Virgin Olive Oil", productMedia("olive,oil", 620970)),
            Map.entry("Monsoon Masala Chai Tin", productMedia("chai,tea", 620980)),
            Map.entry("Sea Salt Dark Chocolate Squares", productMedia("dark,chocolate", 620990)),
            Map.entry("Barrel-Aged Balsamic Reserve", productMedia("balsamic,vinegar", 621000)),
            Map.entry("Breakfast Pantry Gift Box", productMedia("gift,basket", 621010)),
            Map.entry("Bloom Jasmine Green Tea", productMedia("green,tea", 621020)),
            Map.entry("Sicilian Lemon Olive Oil", productMedia("lemon,olive,oil", 621030)),
            Map.entry("Roasted Hazelnut Truffle Box", productMedia("chocolate,truffle", 621040)),
            Map.entry("Mediterranean Tapas Gift Crate", productMedia("food,gift,basket", 621050)),
            Map.entry("Espresso Blend Capsules", productMedia("coffee,capsules", 621060)),
            Map.entry("Smoked Chili Olive Oil", productMedia("chili,oil", 621070)),
            Map.entry("TorqueMax Cordless Drill", productMedia("cordless,drill", 621080)),
            Map.entry("Precision Ratchet Socket Set", productMedia("socket,set", 621090)),
            Map.entry("RoadReady Emergency Battery Pack", productMedia("jump,starter", 621100)),
            Map.entry("Leather Guard Interior Kit", productMedia("leather,care", 621110)),
            Map.entry("SteelCore Impact Driver", productMedia("impact,driver", 621120)),
            Map.entry("FlexGrip Hex Key Bundle", productMedia("hex,key", 621130)),
            Map.entry("All-Weather Trunk Organizer", productMedia("car,organizer", 621140)),
            Map.entry("Ceramic Wash & Wax Duo", productMedia("car,wax", 621150)),
            Map.entry("Workshop Magnetic Light Bar", productMedia("workshop,light", 621160)),
            Map.entry("Compact Tire Inflator", productMedia("tire,inflator", 621170)),
            Map.entry("Microfiber Detailing Towel Pack", productMedia("microfiber,towels", 621180)),
            Map.entry("Trailside Safety Kit", productMedia("emergency,kit", 621190))
    );

    private static ProductMediaSeed productMedia(String sourceTags, int baseLock) {
        return new ProductMediaSeed(sourceTags, List.of(
                productPhotoUrl(sourceTags, baseLock),
                productPhotoUrl(sourceTags, baseLock + 1)
        ));
    }

    private static String productPhotoUrl(String sourceTags, int lock) {
        // Use Unsplash for real product images - keywords mapped to specific photo IDs
        // Format: https://images.unsplash.com/photo-[ID]?w=800&h=1000&fit=crop&q=80
        return "https://images.unsplash.com/" + getUnsplashPhotoId(sourceTags, lock) + "?w=800&h=1000&fit=crop&q=80";
    }

    private static String getUnsplashPhotoId(String tags, int lock) {
        // Map of keywords to real Unsplash photo IDs for product-only shots
        // Priority: Fashion (dresses, coats, bags), then Electronics, then rest
        Map<String, String[]> photoMap = Map.ofEntries(
                // Fashion - Dresses
                Map.entry("satin,dress,women", new String[]{"photo-1595777457583-95e059d581b8", "photo-1572804013309-59a88b7e92f1"}),
                Map.entry("silk,dress,women", new String[]{"photo-1566174053879-31528523f8ae", "photo-1515372039744-b8f02a3ae446"}),
                Map.entry("dress,women", new String[]{"photo-1594938298603-c8148c4dae35", "photo-1578587018452-892bacefd3f2"}),
                // Fashion - Outerwear
                Map.entry("trench,coat", new String[]{"photo-1591047139829-d91aecb6caea", "photo-1544923246-77307dd628b7"}),
                Map.entry("wool,coat,women", new String[]{"photo-1539533018447-63fcce2678e3", "photo-1609804899730-d4a5706a3d99"}),
                // Fashion - Bags
                Map.entry("crossbody,bag", new String[]{"photo-1548036328-c9fa89d128fa", "photo-1584917865442-de89df76afd3"}),
                Map.entry("leather,tote,bag", new String[]{"photo-1590874103328-eac38a683ce7", "photo-1591561954557-26941169b49e"}),
                Map.entry("shoulder,bag", new String[]{"photo-1566150905458-1bf1fc113f0d", "photo-1594223274512-ad4803731b7"}),
                // Fashion - Jewelry
                Map.entry("pearl,earrings", new String[]{"photo-1515562141207-7a88fb7ce338", "photo-1602751584552-8ba73aad10e1"}),
                Map.entry("signet,ring,jewelry", new String[]{"photo-1605100804763-247f67b3557e", "photo-1617038260897-41a1f14a8ca0"}),
                Map.entry("bracelet,jewelry", new String[]{"photo-1611591437281-460bfbe1220a", "photo-1573408301185-9146fe634ad0"}),
                // Fashion - Blazers
                Map.entry("blazer,women", new String[]{"photo-1591047139829-d91aecb6caea", "photo-1594938298603-c8148c4dae35"}),
                // Electronics - Headphones
                Map.entry("wireless,headphones", new String[]{"photo-1505740420928-5e560c06d30e", "photo-1484704849700-f032a568e944"}),
                Map.entry("gaming,headset", new String[]{"photo-1618366712010-f4ae9c647dcb", "photo-1599669454699-248893623440"}),
                // Electronics - Speakers
                Map.entry("bookshelf,speaker", new String[]{"photo-1545454675-3531b543be5d", "photo-1608043152269-423dbba4e7e1"}),
                Map.entry("bluetooth,speaker", new String[]{"photo-1608043152269-423dbba4e7e1", "photo-1558537348-c0f8e59330d3"}),
                Map.entry("soundbar,speaker", new String[]{"photo-1558537348-c0f8e59330d3", "photo-1545454675-3531b543be5d"}),
                // Electronics - Displays
                Map.entry("monitor,screen", new String[]{"photo-1527443224154-c4a3942d3acf", "photo-1586210579191-33b45e38fa2c"}),
                Map.entry("curved,monitor", new String[]{"photo-1586210579191-33b45e38fa2c", "photo-1527443224154-c4a3942d3acf"}),
                // Electronics - Peripherals
                Map.entry("mechanical,keyboard", new String[]{"photo-1587829741301-dc798b83add3", "photo-1511467687858-23d96c32e4ae"}),
                Map.entry("wireless,mouse", new String[]{"photo-1527864550417-7fd91fc51a46", "photo-1615663245857-ac93bb7c39e7"}),
                Map.entry("usb,c,hub", new String[]{"photo-1625723044792-44de16ccb4e9", "photo-1612362463965-4a0b4f2d9b8c"}),
                Map.entry("streaming,microphone", new String[]{"photo-1590602847861-f357a9332bbc", "photo-1598488035139-bdbb223185ce"}),
                Map.entry("laptop,stand", new String[]{"photo-1527443224154-c4a3942d3acf", "photo-1587829741301-dc798b83add3"}),
                // Home & Living - Furniture
                Map.entry("accent,chair", new String[]{"photo-1555041469-a586c61ea9bc", "photo-1506439773649-6e0eb8cfb237"}),
                Map.entry("floor,lamp", new String[]{"photo-1507473885765-e6ed057f782c", "photo-1513506003901-1e6a229e2d15"}),
                Map.entry("table,lamp", new String[]{"photo-1513506003901-1e6a229e2d15", "photo-1507473885765-e6ed057f782c"}),
                Map.entry("pendant,light", new String[]{"photo-1524484485831-a92ffc0de03f", "photo-1513506003901-1e6a229e2d15"}),
                Map.entry("coffee,table", new String[]{"photo-1532372320572-cda25652a6bf", "photo-1555041469-a586c61ea9bc"}),
                Map.entry("console,table", new String[]{"photo-1558997519-83ea9252edf8", "photo-1532372320572-cda25652a6bf"}),
                // Home & Living - Kitchen
                Map.entry("dinnerware,set", new String[]{"photo-1610701596007-11502861dcfa", "photo-1563729768-6af7c46b6eb2"}),
                Map.entry("dutch,oven", new String[]{"photo-1585445490382-0aef6279e2f3", "photo-1584568694244-14fbdf83bd30"}),
                Map.entry("glass,carafe", new String[]{"photo-1577937927133-66ef06acdf18", "photo-1563514227147-6d2ff665a6a0"}),
                Map.entry("serving,board", new String[]{"photo-1544457070-4cd773b4d71e", "photo-1606760227091-3dd870d97b1d"}),
                Map.entry("frying,pan", new String[]{"photo-1556909114-f6e7ad7d3136", "photo-1585445490382-0aef6279e2f3"}),
                Map.entry("basket,table", new String[]{"photo-1558997519-83ea9252edf8", "photo-1532372320572-cda25652a6bf"}),
                // Beauty - Skincare
                Map.entry("serum", new String[]{"photo-1620916566398-39f1143ab7be", "photo-1608248597279-f99d160bfbc8"}),
                Map.entry("cream,jar", new String[]{"photo-1620916566398-39f1143ab7be", "photo-1611080626919-7cf5a9dbab5b"}),
                Map.entry("skincare,bottle", new String[]{"photo-1620916566398-39f1143ab7be", "photo-1608248597279-f99d160bfbc8"}),
                Map.entry("face,mask,jar", new String[]{"photo-1611080626919-7cf5a9dbab5b", "photo-1620916566398-39f1143ab7be"}),
                Map.entry("beauty,serum", new String[]{"photo-1608248597279-f99d160bfbc8", "photo-1620916566398-39f1143ab7be"}),
                Map.entry("cosmetics", new String[]{"photo-1596462502278-27bfdc403348", "photo-1611080626919-7cf5a9dbab5b"}),
                // Beauty - Haircare
                Map.entry("shampoo,bottle", new String[]{"photo-1608248597279-f99d160bfbc8", "photo-1620916566398-39f1143ab7be"}),
                Map.entry("hair,brush", new String[]{"photo-1608248597279-f99d160bfbc8", "photo-1589994961551"}),
                Map.entry("hair,treatment", new String[]{"photo-1620916566398-39f1143ab7be", "photo-1608248597279-f99d160bfbc8"}),
                Map.entry("curling,iron", new String[]{"photo-1589994961551", "photo-1608248597279-f99d160bfbc8"}),
                Map.entry("hair,dryer", new String[]{"photo-1589994961551", "photo-1608248597279-f99d160bfbc8"}),
                // Sports - Training
                Map.entry("kettlebell", new String[]{"photo-1517836357463-d25dfeac3438", "photo-1571019613454-1cb2f99b2d8b"}),
                Map.entry("resistance,bands", new String[]{"photo-1571019613454-1cb2f99b2d8b", "photo-1517836357463-d25dfeac3438"}),
                Map.entry("dumbbells", new String[]{"photo-1534438327276-14e5300c3a48", "photo-1571019613454-1cb2f99b2d8b"}),
                Map.entry("foam,roller", new String[]{"photo-1517836357463-d25dfeac3438", "photo-1571019613454-1cb2f99b2d8b"}),
                // Sports - Outdoor
                Map.entry("yoga,mat", new String[]{"photo-1601925260368-ae2f83cf8b7f", "photo-1518611012118-696072aa579a"}),
                Map.entry("hiking,daypack", new String[]{"photo-1553062407-98eeb64c6a62", "photo-1483721310020-92893acbb61e"}),
                Map.entry("camping,lantern", new String[]{"photo-1504280390367-361c6d9f38f4", "photo-1478131143081-80f7f84ca84d"}),
                Map.entry("tent", new String[]{"photo-1504280390367-361c6d9f38f4", "photo-1478131143081-80f7f84ca84d"}),
                Map.entry("cycling,helmet", new String[]{"photo-1558981806-ec527fa84c39", "photo-1517649763962-0c623066013b"}),
                Map.entry("running,vest", new String[]{"photo-1553062407-98eeb64c6a62", "photo-1483721310020-92893acbb61e"}),
                Map.entry("sleeping,pad", new String[]{"photo-1523987355523-c7b5b0dd90a7", "photo-1504280390367-361c6d9f38f4"}),
                Map.entry("bike,pump", new String[]{"photo-1485965120184-e220f721d03e", "photo-1504280390367-361c6d9f38f4"}),
                // Toys & Games
                Map.entry("blocks,toy", new String[]{"photo-1587654780291-39c9404d746b", "photo-1587653917615-3c9eadb280d2"}),
                Map.entry("robot,toy", new String[]{"photo-1587653917615-3c9eadb280d2", "photo-1587654780291-39c9404d746b"}),
                Map.entry("art,supplies", new String[]{"photo-1513364776144-60967b0f800f", "photo-1589994961551"}),
                Map.entry("puzzle,tiles", new String[]{"photo-1587654780291-39c9404d746b", "photo-1587653917615-3c9eadb280d2"}),
                // Baby & Kids
                Map.entry("bento,box", new String[]{"photo-1584568694244-14fbdf83bd30", "photo-1556909114-f6e7ad7d3136"}),
                Map.entry("nursery,lamp", new String[]{"photo-1513506003901-1e6a229e2d15", "photo-1507473885765-e6ed057f782c"}),
                Map.entry("baby,plate", new String[]{"photo-1563729768-6af7c46b6eb2", "photo-1610701596007-11502861dcfa"}),
                Map.entry("baby,swaddle", new String[]{"photo-1519689680058-324335c77eba", "photo-1519681393784-d120267933ba"}),
                // Books & Stationery
                Map.entry("novel,book", new String[]{"photo-1544947950-fa07a98d237f", "photo-1512820790803-83ca734da794"}),
                Map.entry("design,book", new String[]{"photo-1544947950-fa07a98d237f", "photo-1512820790803-83ca734da794"}),
                Map.entry("planner,notebook", new String[]{"photo-1531346878377-a5be20888e57", "photo-1517842645765-c639b6bbd9c5"}),
                Map.entry("journal", new String[]{"photo-1531346878377-a5be20888e57", "photo-1517842645765-c639b6bbd9c5"}),
                Map.entry("desk,organizer", new String[]{"photo-1507925921958-8a62f3d1a50d", "photo-1524758631624-e2822e304c36"}),
                Map.entry("gel,pens", new String[]{"photo-1517842645765-c639b6bbd9c5", "photo-1531346878377-a5be20888e57"}),
                Map.entry("workbook,notebook", new String[]{"photo-1517842645765-c639b6bbd9c5", "photo-1531346878377-a5be20888e57"}),
                Map.entry("travel,book", new String[]{"photo-1544947950-fa07a98d237f", "photo-1512820790803-83ca734da794"}),
                Map.entry("lifestyle,book", new String[]{"photo-1512820790803-83ca734da794", "photo-1544947950-fa07a98d237f"}),
                Map.entry("fiction,book", new String[]{"photo-1544947950-fa07a98d237f", "photo-1512820790803-83ca734da794"}),
                Map.entry("monitor,stand", new String[]{"photo-1527443224154-c4a3942d3acf", "photo-1587829741301-dc798b83add3"}),
                Map.entry("desk,pad", new String[]{"photo-1507925921958-8a62f3d1a50d", "photo-1524758631624-e2822e304c36"}),
                // Pet Supplies
                Map.entry("dog,bed", new String[]{"photo-1587300003388-59208cc962cb", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("dog,crate", new String[]{"photo-1587300003388-59208cc962cb", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("rope,dog,toy", new String[]{"photo-1601758224511-b6a9c52ada5d", "photo-1587300003388-59208cc962cb"}),
                Map.entry("pet,bowls", new String[]{"photo-1601758224511-b6a9c52ada5d", "photo-1587300003388-59208cc962cb"}),
                Map.entry("cat,scratching,post", new String[]{"photo-1545249390-6b5fa8d1d1c2", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("dog,mat", new String[]{"photo-1587300003388-59208cc962cb", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("dog,leash", new String[]{"photo-1601758224511-b6a9c52ada5d", "photo-1587300003388-59208cc962cb"}),
                Map.entry("cat,toy", new String[]{"photo-1545249390-6b5fa8d1d1c2", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("cat,hammock", new String[]{"photo-1545249390-6b5fa8d1d1c2", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("cat,scratcher", new String[]{"photo-1545249390-6b5fa8d1d1c2", "photo-1601758224511-b6a9c52ada5d"}),
                Map.entry("treat,bag", new String[]{"photo-1601758224511-b6a9c52ada5d", "photo-1587300003388-59208cc962cb"}),
                // Food & Grocery
                Map.entry("coffee,beans", new String[]{"photo-1559056199-641a0ac8b55e", "photo-1514432324607-a09d9b4aefdd"}),
                Map.entry("olive,oil", new String[]{"photo-1474979266404-7eaacbcd87c5", "photo-1549465220-1a8b9238cd48"}),
                Map.entry("chai,tea", new String[]{"photo-1564890369478-c89ca6d9cbe9", "photo-1556679343-c7306c2c9a5a"}),
                Map.entry("dark,chocolate", new String[]{"photo-1606312619070-d48b4c652a52", "photo-1549007994-cb92caebd54b"}),
                Map.entry("balsamic,vinegar", new String[]{"photo-1474979266404-7eaacbcd87c5", "photo-1513885535751-8b9238cd8b48"}),
                Map.entry("gift,basket", new String[]{"photo-1549465220-1a8b9238cd48", "photo-1513885535751-8b9238cd8b48"}),
                Map.entry("green,tea", new String[]{"photo-1564890369478-c89ca6d9cbe9", "photo-1556679343-c7306c2c9a5a"}),
                Map.entry("lemon,olive,oil", new String[]{"photo-1474979266404-7eaacbcd87c5", "photo-1564890369478-c89ca6d9cbe9"}),
                Map.entry("chocolate,truffle", new String[]{"photo-1606312619070-d48b4c652a52", "photo-1549007994-cb92caebd54b"}),
                Map.entry("food,gift,basket", new String[]{"photo-1549465220-1a8b9238cd48", "photo-1513885535751-8b9238cd8b48"}),
                Map.entry("coffee,capsules", new String[]{"photo-1559056199-641a0ac8b55e", "photo-1514432324607-a09d9b4aefdd"}),
                Map.entry("chili,oil", new String[]{"photo-1474979266404-7eaacbcd87c5", "photo-1556679343-c7306c2c9a5a"}),
                // Automotive
                Map.entry("cordless,drill", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("socket,set", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("jump,starter", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("leather,care", new String[]{"photo-1601362840159-f2b43e717e5b", "photo-1504148455328-c376907d081c"}),
                Map.entry("impact,driver", new String[]{"photo-1581092334651-ddf26d9a09d0", "photo-1504148455328-c376907d081c"}),
                Map.entry("hex,key", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("car,organizer", new String[]{"photo-1601362840159-f2b43e717e5b", "photo-1504148455328-c376907d081c"}),
                Map.entry("car,wax", new String[]{"photo-1601362840159-f2b43e717e5b", "photo-1504148455328-c376907d081c"}),
                Map.entry("workshop,light", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("tire,inflator", new String[]{"photo-1504148455328-c376907d081c", "photo-1581092334651-ddf26d9a09d0"}),
                Map.entry("microfiber,towels", new String[]{"photo-1601362840159-f2b43e717e5b", "photo-1504148455328-c376907d081c"}),
                Map.entry("emergency,kit", new String[]{"photo-1601362840159-f2b43e717e5b", "photo-1504148455328-c376907d081c"}),
                // Default fallback
                Map.entry("default", new String[]{"photo-1505740420928-5e560c06d30e", "photo-1523275335684-37898b6baf30"})
        );

        // Find matching photo IDs based on tags
        String[] matchingPhotos = photoMap.getOrDefault(tags, photoMap.get("default"));
        int index = lock % matchingPhotos.length;
        return matchingPhotos[index];
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
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        normalizeLegacyEnums();
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

    private void normalizeLegacyEnums() {
        normalizeLegacyCouponTypeEnum();
        normalizeLegacyOrderStatusEnum();
        normalizeProductImageBlobColumn();
    }

    private void normalizeLegacyCouponTypeEnum() {
        String columnType = jdbcTemplate.query(
                """
                        SELECT COLUMN_TYPE
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'coupon'
                          AND COLUMN_NAME = 'type'
                        """,
                rs -> rs.next() ? rs.getString("COLUMN_TYPE") : null
        );
        if (columnType == null || !columnType.toUpperCase(Locale.ROOT).contains("PERCENTAGE")) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE coupon MODIFY COLUMN type ENUM('FIXED','PERCENTAGE','PERCENT') NOT NULL");
        jdbcTemplate.update("UPDATE coupon SET type = 'PERCENT' WHERE type = 'PERCENTAGE'");
        jdbcTemplate.execute("ALTER TABLE coupon MODIFY COLUMN type ENUM('FIXED','PERCENT') NOT NULL");
    }

    private void normalizeLegacyOrderStatusEnum() {
        String columnType = jdbcTemplate.query(
                """
                        SELECT COLUMN_TYPE
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'orders'
                          AND COLUMN_NAME = 'status'
                        """,
                rs -> rs.next() ? rs.getString("COLUMN_TYPE") : null
        );
        if (columnType == null || columnType.toUpperCase(Locale.ROOT).contains("PROCESSING")) {
            return;
        }

        jdbcTemplate.execute(
                "ALTER TABLE orders MODIFY COLUMN status ENUM('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL");
    }

    private void normalizeProductImageBlobColumn() {
        String dataType = jdbcTemplate.query(
                """
                        SELECT DATA_TYPE
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'product_image'
                          AND COLUMN_NAME = 'image_data'
                        """,
                rs -> rs.next() ? rs.getString("DATA_TYPE") : null
        );
        if (dataType == null || "longblob".equalsIgnoreCase(dataType)) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE product_image MODIFY COLUMN image_data LONGBLOB NULL");
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
                                .filter(product -> hasCurrentSeedImages(product, mediaFor(productSeed.name())))
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
