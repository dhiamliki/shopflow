package com.shopflow.utils;

import com.shopflow.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
public class OrderNumberGenerator {

    private final OrderRepository orderRepository;

    public String next() {
        int year = LocalDate.now().getYear();
        String candidate;
        do {
            int randomPart = ThreadLocalRandom.current().nextInt(10000, 100000);
            candidate = String.format("ORD-%d-%05d", year, randomPart);
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }
}
