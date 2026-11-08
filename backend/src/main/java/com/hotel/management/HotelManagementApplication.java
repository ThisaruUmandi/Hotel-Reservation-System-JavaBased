package com.hotel.management;

import com.hotel.management.model.Room;
import com.hotel.management.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;

@SpringBootApplication
public class HotelManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(HotelManagementApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(RoomRepository rooms) {
        return args -> {
            if (rooms.count() == 0) {
                rooms.save(new Room("101", "SINGLE", new BigDecimal("80")));
                rooms.save(new Room("102", "DOUBLE", new BigDecimal("120")));
                rooms.save(new Room("201", "SUITE", new BigDecimal("250")));
            }
        };
    }
}
