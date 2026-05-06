package com.shopflow.repositories;

import com.shopflow.entities.Address;
import com.shopflow.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);
    java.util.Optional<Address> findByIdAndUser(Long id, User user);
}
