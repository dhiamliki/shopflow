package com.shopflow.services;

import com.shopflow.dto.address.AddressRequest;
import com.shopflow.dto.address.AddressResponse;
import com.shopflow.entities.Address;
import com.shopflow.entities.User;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.AddressRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AddressResponse> myAddresses() {
        return addressRepository.findByUser(currentUser()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AddressResponse create(AddressRequest request) {
        User user = currentUser();
        if (request.principal()) {
            clearPrincipalAddress(user);
        }
        Address address = Address.builder()
                .user(user)
                .street(request.street())
                .city(request.city())
                .postalCode(request.postalCode())
                .country(request.country())
                .principal(request.principal())
                .build();
        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse update(Long id, AddressRequest request) {
        User user = currentUser();
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Address not found"));
        if (request.principal()) {
            clearPrincipalAddress(user);
        }
        address.setStreet(request.street());
        address.setCity(request.city());
        address.setPostalCode(request.postalCode());
        address.setCountry(request.country());
        address.setPrincipal(request.principal());
        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public void delete(Long id) {
        User user = currentUser();
        Address address = addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Address not found"));
        addressRepository.delete(address);
    }

    private void clearPrincipalAddress(User user) {
        List<Address> addresses = addressRepository.findByUser(user);
        addresses.forEach(address -> address.setPrincipal(false));
        addressRepository.saveAll(addresses);
    }

    private AddressResponse toResponse(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getStreet(),
                address.getCity(),
                address.getPostalCode(),
                address.getCountry(),
                address.isPrincipal()
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }
}
