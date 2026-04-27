package com.shopflow.repositories;

import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    Optional<SellerProfile> findByUser(User user);
}
