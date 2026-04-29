package com.shopflow.services;

import com.shopflow.dto.product.*;
import com.shopflow.dto.review.ReviewResponse;
import com.shopflow.entities.*;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.*;
import com.shopflow.specifications.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        User seller = getCurrentUser();
        validatePromoPrice(request.price(), request.promoPrice());
        Set<Category> categories = resolveCategories(request.categoryIds());

        Product product = Product.builder()
                .seller(seller)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .promoPrice(request.promoPrice())
                .stock(request.stock())
                .active(true)
                .build();
        product.setCategories(categories);
        replaceImages(product, request.imageUrls());
        replaceVariants(product, request.variants());

        return toProductResponse(productRepository.save(product), false);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        ensureCanManageProduct(product);
        validatePromoPrice(request.price(), request.promoPrice());

        Set<Category> categories = resolveCategories(request.categoryIds());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setPromoPrice(request.promoPrice());
        product.setStock(request.stock());
        product.setCategories(categories);

        replaceImages(product, request.imageUrls());
        replaceVariants(product, request.variants());

        return toProductResponse(productRepository.save(product), false);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        ensureCanManageProduct(product);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> filterProducts(ProductFilterRequest filterRequest) {
        int page = filterRequest.page() == null ? 0 : filterRequest.page();
        int size = filterRequest.size() == null ? 12 : filterRequest.size();

        Specification<Product> spec = ProductSpecification.activeOnly()
                .and(ProductSpecification.nameContains(filterRequest.search()))
                .and(ProductSpecification.categoryIn(filterRequest.categoryIds()))
                .and(ProductSpecification.sellerEquals(filterRequest.sellerId()))
                .and(ProductSpecification.promoOnly(filterRequest.promoOnly()))
                .and(ProductSpecification.minPrice(filterRequest.minPrice()))
                .and(ProductSpecification.maxPrice(filterRequest.maxPrice()));

        Pageable pageable = PageRequest.of(page, size, buildSort(filterRequest.sortBy(), filterRequest.sortDirection()));
        return productRepository.findAll(spec, pageable).map(product -> toProductResponse(product, false));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getSellerProducts(int page, int size) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return productRepository.findBySeller_Email(email, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(product -> toProductResponse(product, false));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String query) {
        return productRepository.searchFullText(query, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")))
                .stream()
                .map(product -> toProductResponse(product, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> topSellingProducts() {
        return orderItemRepository.findTopSellingProducts(PageRequest.of(0, 10))
                .stream()
                .map(product -> toProductResponse(product, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        if (!product.isActive()) {
            User current = tryGetCurrentUser();
            if (current == null || current.getRole() != Role.ADMIN) {
                throw new NotFoundException("Product not found");
            }
        }
        return toProductResponse(product, true);
    }

    @Transactional(readOnly = true)
    public ProductVariant getVariantForProduct(Long productId, Long variantId) {
        return productVariantRepository.findByIdAndProduct_Id(variantId, productId)
                .orElseThrow(() -> new NotFoundException("Product variant not found"));
    }

    public double effectiveUnitPrice(Product product, ProductVariant variant) {
        double basePrice = product.getPromoPrice() != null && product.getPromoPrice() < product.getPrice()
                ? product.getPromoPrice()
                : product.getPrice();
        if (variant != null && variant.getPriceDelta() != null) {
            basePrice += variant.getPriceDelta();
        }
        return basePrice;
    }

    private ProductResponse toProductResponse(Product product, boolean includeReviews) {
        List<String> categories = product.getCategories().stream()
                .map(Category::getName)
                .sorted()
                .toList();
        List<String> imageUrls = product.getImages().stream()
                .sorted(Comparator
                        .comparing(ProductImage::isPrimaryImage)
                        .reversed()
                        .thenComparing(image -> image.getId() == null ? Long.MAX_VALUE : image.getId()))
                .map(this::toImageSource)
                .filter(Objects::nonNull)
                .toList();
        List<ProductVariantResponse> variants = product.getVariants().stream()
                .map(v -> new ProductVariantResponse(v.getId(), v.getAttributeName(), v.getAttributeValue(), v.getPriceDelta(), v.getStock()))
                .toList();
        Double avg = reviewRepository.averageApprovedRatingByProductId(product.getId());

        List<ReviewResponse> reviews = includeReviews
                ? reviewRepository.findByProduct_IdAndApprovedTrueOrderByCreatedAtDesc(product.getId()).stream()
                .map(r -> new ReviewResponse(
                        r.getId(),
                        product.getId(),
                        r.getUser().getId(),
                        r.getUser().getFirstName() + " " + r.getUser().getLastName(),
                        r.getRating(),
                        r.getComment(),
                        r.isApproved(),
                        r.getCreatedAt()
                ))
                .toList()
                : List.of();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getPromoPrice(),
                effectiveUnitPrice(product, null),
                product.getStock(),
                product.getSalesCount(),
                categories,
                product.getSeller().getFirstName() + " " + product.getSeller().getLastName(),
                imageUrls,
                variants,
                avg == null ? 0.0 : avg,
                reviews
        );
    }

    private Sort buildSort(String sortBy, String direction) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolved = switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "price" -> "price";
            case "popularity" -> "salesCount";
            case "newest" -> "createdAt";
            default -> "createdAt";
        };
        return Sort.by(dir, resolved);
    }

    private void validatePromoPrice(Double price, Double promoPrice) {
        if (promoPrice != null && promoPrice >= price) {
            throw new BadRequestException("Promo price must be lower than regular price");
        }
    }

    private Set<Category> resolveCategories(List<Long> categoryIds) {
        Set<Category> categories = new HashSet<>();
        for (Long id : categoryIds) {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("Category not found: " + id));
            categories.add(category);
        }
        return categories;
    }

    private void replaceImages(Product product, List<String> imageUrls) {
        product.getImages().clear();
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }
        for (int i = 0; i < imageUrls.size(); i++) {
            String url = imageUrls.get(i);
            product.getImages().add(ProductImage.builder()
                    .product(product)
                    .imageUrl(url)
                    .primaryImage(i == 0)
                    .build());
        }
    }

    private String toImageSource(ProductImage image) {
        byte[] imageData = image.getImageData();
        if (imageData != null && imageData.length > 0) {
            String contentType = image.getContentType() == null ? "image/jpeg" : image.getContentType();
            return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(imageData);
        }
        return image.getImageUrl();
    }

    private void replaceVariants(Product product, List<ProductVariantRequest> variantRequests) {
        product.getVariants().clear();
        if (variantRequests == null || variantRequests.isEmpty()) {
            return;
        }
        for (ProductVariantRequest request : variantRequests) {
            product.getVariants().add(ProductVariant.builder()
                    .product(product)
                    .attributeName(request.attributeName())
                    .attributeValue(request.attributeValue())
                    .priceDelta(request.priceDelta() == null ? 0.0 : request.priceDelta())
                    .stock(request.stock())
                    .build());
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private User tryGetCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return null;
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private void ensureCanManageProduct(Product product) {
        User currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = product.getSeller().getId().equals(currentUser.getId());
        if (!isAdmin && !isOwner) {
            throw new BadRequestException("You cannot manage this product");
        }
    }
}
