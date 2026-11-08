package com.hotel.management.dto;

import java.util.List;

public record RoomReviewsResponse(double averageRating, int count, List<ReviewResponse> reviews) {}
