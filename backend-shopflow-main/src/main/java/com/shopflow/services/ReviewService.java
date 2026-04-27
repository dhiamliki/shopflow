package com.shopflow.services;

import com.shopflow.dto.review.ReviewRequest;
import com.shopflow.dto.review.ReviewResponse;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.Product;
import com.shopflow.entities.Review;
import com.shopflow.entities.User;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.OrderItemRepository;
import com.shopflow.repositories.ProductRepository;
import com.shopflow.repositories.ReviewRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional
    public ReviewResponse create(ReviewRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found"));
        User user = currentUser();

        boolean purchased = orderItemRepository.existsPurchasedProductByCustomer(
                user,
                product,
                Set.of(OrderStatus.DELIVERED)
        );
        if (!purchased) {
            throw new BadRequestException("You can review only products you purchased and received");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.rating())
                .comment(request.comment())
                .approved(false)
                .build();

        return toResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getApprovedProductReviews(Long productId) {
        return reviewRepository.findByProduct_IdAndApprovedTrueOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse approve(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Review not found"));
        review.setApproved(true);
        return toResponse(reviewRepository.save(review));
    }

    private ReviewResponse toResponse(Review review) {
        User user = review.getUser();
        return new ReviewResponse(
                review.getId(),
                review.getProduct().getId(),
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                review.getRating(),
                review.getComment(),
                review.isApproved(),
                review.getCreatedAt()
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }
}
