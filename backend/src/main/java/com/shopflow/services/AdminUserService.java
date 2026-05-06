package com.shopflow.services;

import com.shopflow.dto.admin.AdminUserResponse;
import com.shopflow.entities.User;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse setActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        User currentUser = currentUser();
        if (currentUser.getId().equals(user.getId()) && !active) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        user.setActive(active);
        return toResponse(userRepository.save(user));
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
