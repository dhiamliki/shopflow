package com.shopflow.config;

import com.shopflow.entities.*;
import com.shopflow.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevMarketplaceSeeder implements CommandLineRunner {

    private static final String SELLER_PASSWORD = "Seller123!";
    private static final String CUSTOMER_PASSWORD = "Customer123!";

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
        List<SellerSeed> sellerSeeds = sellerSeeds();
        List<CustomerSeed> customerSeeds = customerSeeds();
        if (isSeedComplete(sellerSeeds)) {
            return;
        }

        Map<String, User> sellersByEmail = createSellers(sellerSeeds);
        List<User> customers = createCustomers(customerSeeds);
        Map<String, Coupon> couponsByCode = createCoupons();
        Map<String, Category> categoriesByName = createCategoryTree();
        List<Product> products = createProducts(sellerSeeds, sellersByEmail, categoriesByName);
        createReviews(products, customers);
        Map<User, List<Address>> customerAddresses = createCustomerAddresses(customers);
        createOrders(customers, customerAddresses, products);
        createCarts(customers, products, couponsByCode);
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
                                .filter(product -> product.getImages().stream()
                                        .anyMatch(image -> image.getImageData() != null && image.getImageData().length > 0))
                                .isPresent()));
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

                attachImages(product, sellerSeed.imageBank(), productIndex);
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

    private void attachImages(Product product, List<String> imageBank, int startIndex) {
        product.getImages().clear();
        
        // Get product-specific images based on product name
        List<String> productImages = getProductSpecificImages(product.getName());
        
        for (int i = 0; i < 3; i++) {
            String fileName = productImages.get(i % productImages.size());
            product.getImages().add(ProductImage.builder()
                    .product(product)
                    .imageUrl("seed-images/" + fileName)
                    .imageData(readSeedImage(fileName))
                    .contentType(contentTypeFor(fileName))
                    .fileName(fileName)
                    .primaryImage(i == 0)
                    .build());
        }
    }
    
    private List<String> getProductSpecificImages(String productName) {
        String lowerName = productName.toLowerCase();
        
        // Fashion - Dresses
        if (lowerName.contains("dress") || lowerName.contains("midi") || lowerName.contains("silk") || lowerName.contains("evening")) {
            return List.of("fashion-01.jpg", "fashion-02.jpg", "fashion-03.jpg");
        }
        // Fashion - Coats & Blazers
        if (lowerName.contains("coat") || lowerName.contains("trench") || lowerName.contains("blazer") || lowerName.contains("wrap")) {
            return List.of("fashion-04.jpg", "fashion-05.jpg", "fashion-01.jpg");
        }
        // Fashion - Bags
        if (lowerName.contains("bag") || lowerName.contains("tote") || lowerName.contains("crossbody") || lowerName.contains("shoulder")) {
            return List.of("fashion-02.jpg", "fashion-03.jpg", "fashion-04.jpg");
        }
        // Fashion - Jewelry
        if (lowerName.contains("jewelry") || lowerName.contains("ring") || lowerName.contains("bracelet") || lowerName.contains("pearl") || lowerName.contains("necklace")) {
            return List.of("fashion-05.jpg", "fashion-01.jpg", "fashion-02.jpg");
        }
        
        // Electronics - Headphones
        if (lowerName.contains("headphone") || lowerName.contains("headset") || lowerName.contains("earphone")) {
            return List.of("electronics-01.jpg", "electronics-02.jpg", "electronics-03.jpg");
        }
        // Electronics - Speakers
        if (lowerName.contains("speaker") || lowerName.contains("soundbar") || lowerName.contains("audio")) {
            return List.of("electronics-03.jpg", "electronics-04.jpg", "electronics-05.jpg");
        }
        // Electronics - Display/Monitor
        if (lowerName.contains("display") || lowerName.contains("monitor") || lowerName.contains("screen")) {
            return List.of("electronics-04.jpg", "electronics-05.jpg", "electronics-01.jpg");
        }
        // Electronics - Peripherals (keyboard, mouse, dock, stand)
        if (lowerName.contains("keyboard") || lowerName.contains("mouse") || lowerName.contains("dock") || lowerName.contains("stand") || lowerName.contains("laptop")) {
            return List.of("electronics-02.jpg", "electronics-03.jpg", "electronics-04.jpg");
        }
        
        // Home - Furniture (chair, table, console)
        if (lowerName.contains("chair") || lowerName.contains("table") || lowerName.contains("console") || lowerName.contains("furniture")) {
            return List.of("home-01.jpg", "home-02.jpg", "home-03.jpg");
        }
        // Home - Lighting (lamp, pendant, light)
        if (lowerName.contains("lamp") || lowerName.contains("light") || lowerName.contains("pendant")) {
            return List.of("home-03.jpg", "home-04.jpg", "home-05.jpg");
        }
        // Home - Cookware (pot, pan, oven, fry)
        if (lowerName.contains("pot") || lowerName.contains("pan") || lowerName.contains("oven") || lowerName.contains("cookware") || lowerName.contains("dutch")) {
            return List.of("home-04.jpg", "home-05.jpg", "home-01.jpg");
        }
        // Home - Serveware (carafe, board, set, dinner)
        if (lowerName.contains("carafe") || lowerName.contains("board") || lowerName.contains("serveware") || lowerName.contains("dinner") || lowerName.contains("stoneware")) {
            return List.of("home-05.jpg", "home-01.jpg", "home-02.jpg");
        }
        
        // Beauty - Skincare (serum, cream, moisturizer, gel)
        if (lowerName.contains("serum") || lowerName.contains("cream") || lowerName.contains("moisturizer") || lowerName.contains("gel") || lowerName.contains("mask") || lowerName.contains("skincare")) {
            return List.of("beauty-01.jpg", "beauty-02.jpg", "beauty-03.jpg");
        }
        // Beauty - Haircare (shampoo, treatment, brush, wand, dryer)
        if (lowerName.contains("shampoo") || lowerName.contains("treatment") || lowerName.contains("brush") || lowerName.contains("wand") || lowerName.contains("dryer") || lowerName.contains("hair")) {
            return List.of("beauty-03.jpg", "beauty-04.jpg", "beauty-05.jpg");
        }
        
        // Sports - Training (kettlebell, band, roller, dumbbell)
        if (lowerName.contains("kettlebell") || lowerName.contains("band") || lowerName.contains("roller") || lowerName.contains("dumbbell") || lowerName.contains("training") || lowerName.contains("strength")) {
            return List.of("sports-01.jpg", "sports-02.jpg", "sports-03.jpg");
        }
        // Sports - Outdoor (tent, lantern, pack, helmet, pad, pump)
        if (lowerName.contains("tent") || lowerName.contains("lantern") || lowerName.contains("pack") || lowerName.contains("helmet") || lowerName.contains("pad") || lowerName.contains("pump") || lowerName.contains("vest") || lowerName.contains("outdoor") || lowerName.contains("camping") || lowerName.contains("cycling") || lowerName.contains("yoga")) {
            return List.of("sports-03.jpg", "sports-04.jpg", "sports-05.jpg");
        }
        
        // Kids - STEM Toys
        if (lowerName.contains("stem") || lowerName.contains("magnetic") || lowerName.contains("coding") || lowerName.contains("puzzle") || lowerName.contains("logic")) {
            return List.of("kids-01.jpg", "kids-02.jpg", "kids-03.jpg");
        }
        // Kids - Arts & Crafts
        if (lowerName.contains("art") || lowerName.contains("craft") || lowerName.contains("paint") || lowerName.contains("sticker")) {
            return List.of("kids-03.jpg", "kids-04.jpg", "kids-05.jpg");
        }
        // Kids - Baby & Nursery (feeding, nursery, lamp, swaddle, chart)
        if (lowerName.contains("feeding") || lowerName.contains("nursery") || lowerName.contains("lamp") || lowerName.contains("swaddle") || lowerName.contains("chart") || lowerName.contains("plate") || lowerName.contains("box") || lowerName.contains("plush") || lowerName.contains("bento")) {
            return List.of("kids-04.jpg", "kids-05.jpg", "kids-01.jpg");
        }
        
        // Books - Fiction
        if (lowerName.contains("novel") || lowerName.contains("fiction") || lowerName.contains("harbor") || lowerName.contains("quiet") || lowerName.contains("living")) {
            return List.of("books-01.jpg", "books-02.jpg", "books-03.jpg");
        }
        // Books - Non-Fiction
        if (lowerName.contains("guide") || lowerName.contains("field guide") || lowerName.contains("strategy") || lowerName.contains("atlas") || lowerName.contains("non-fiction")) {
            return List.of("books-03.jpg", "books-04.jpg", "books-05.jpg");
        }
        // Books - Stationery (planner, journal, organizer, pen, pad, riser)
        if (lowerName.contains("planner") || lowerName.contains("journal") || lowerName.contains("organizer") || lowerName.contains("pen") || lowerName.contains("pad") || lowerName.contains("riser") || lowerName.contains("desk")) {
            return List.of("books-05.jpg", "books-01.jpg", "books-02.jpg");
        }
        
        // Pets - Dog Care (bed, crate, toy, lead, pouch)
        if (lowerName.contains("dog") || lowerName.contains("bed") || lowerName.contains("crate") || lowerName.contains("toy") || lowerName.contains("lead") || lowerName.contains("pouch") || lowerName.contains("lick")) {
            return List.of("pets-01.jpg", "pets-02.jpg", "pets-03.jpg");
        }
        // Pets - Cat Care (cat, bowl, scratcher, hammock, feeder)
        if (lowerName.contains("cat") || lowerName.contains("bowl") || lowerName.contains("scratcher") || lowerName.contains("hammock") || lowerName.contains("feeder") || lowerName.contains("whisker")) {
            return List.of("pets-03.jpg", "pets-04.jpg", "pets-05.jpg");
        }
        
        // Grocery - Coffee & Tea
        if (lowerName.contains("coffee") || lowerName.contains("espresso") || lowerName.contains("chai") || lowerName.contains("tea") || lowerName.contains("roast")) {
            return List.of("grocery-01.jpg", "grocery-02.jpg", "grocery-03.jpg");
        }
        // Grocery - Olive Oil & Vinegar
        if (lowerName.contains("olive") || lowerName.contains("oil") || lowerName.contains("vinegar") || lowerName.contains("balsamic")) {
            return List.of("grocery-03.jpg", "grocery-04.jpg", "grocery-05.jpg");
        }
        // Grocery - Chocolate & Gift
        if (lowerName.contains("chocolate") || lowerName.contains("truffle") || lowerName.contains("gift") || lowerName.contains("box") || lowerName.contains("crate")) {
            return List.of("grocery-05.jpg", "grocery-01.jpg", "grocery-02.jpg");
        }
        
        // Automotive - Power Tools
        if (lowerName.contains("drill") || lowerName.contains("driver") || lowerName.contains("impact") || lowerName.contains("light") || lowerName.contains("power")) {
            return List.of("tools-01.jpg", "tools-02.jpg", "tools-03.jpg");
        }
        // Automotive - Hand Tools
        if (lowerName.contains("socket") || lowerName.contains("ratchet") || lowerName.contains("key") || lowerName.contains("hex") || lowerName.contains("hand")) {
            return List.of("tools-03.jpg", "tools-04.jpg", "tools-05.jpg");
        }
        // Automotive - Car Care
        if (lowerName.contains("battery") || lowerName.contains("tire") || lowerName.contains("trunk") || lowerName.contains("wash") || lowerName.contains("wax") || lowerName.contains("towel") || lowerName.contains("leather") || lowerName.contains("kit") || lowerName.contains("organizer") || lowerName.contains("safety")) {
            return List.of("tools-04.jpg", "tools-05.jpg", "tools-01.jpg");
        }
        
        // Default fallback - use generic category images
        return List.of("home-01.jpg", "home-02.jpg", "home-03.jpg");
    }

    private byte[] readSeedImage(String fileName) {
        String resourcePath = "/seed-images/" + fileName;
        try (InputStream inputStream = DevMarketplaceSeeder.class.getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IllegalStateException("Missing seed image asset: " + resourcePath);
            }
            return inputStream.readAllBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read seed image asset: " + resourcePath, exception);
        }
    }

    private String contentTypeFor(String fileName) {
        String lowerName = fileName.toLowerCase(Locale.ROOT);
        if (lowerName.endsWith(".png")) {
            return "image/png";
        }
        if (lowerName.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
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

    private List<String> seedImages(String slug) {
        return List.of(
                slug + "-01.jpg",
                slug + "-02.jpg",
                slug + "-03.jpg",
                slug + "-04.jpg",
                slug + "-05.jpg"
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
                seedImages("fashion"),
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
                seedImages("electronics"),
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
                seedImages("home"),
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
                seedImages("beauty"),
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
                seedImages("sports"),
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
                seedImages("kids"),
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
                seedImages("books"),
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
                seedImages("pets"),
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
                seedImages("grocery"),
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
                seedImages("tools"),
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
                ))
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
                              List<String> imageBank,
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

    private record DepartmentSeed(String name, String description, List<CategoryBranchSeed> branches) {
    }

    private record CategoryBranchSeed(String name, String description, List<CategoryLeafSeed> leaves) {
    }

    private record CategoryLeafSeed(String name, String description) {
    }
}
