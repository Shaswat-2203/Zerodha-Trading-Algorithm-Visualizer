package com.example.zerodhatradingalgo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;


@SpringBootApplication
public class ZerodhaTradingAlgoApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZerodhaTradingAlgoApplication.class, args);
    }
}

@CrossOrigin
@RestController
@RequestMapping("/api")
class TradingController {

    private static final String TICKER = "GOOGLE";

    static class User {
        public String id;
        public Map<String, Double> balances;

        public User(String id, Map<String, Double> balances) {
            this.id = id;
            this.balances = balances;
        }
    }

    static class Order {
        public String userId;
        public double price;
        public double quantity;

        public Order(String userId, double price, double quantity) {
            this.userId = userId;
            this.price = price;
            this.quantity = quantity;
        }
    }

    private final List<User> users = new ArrayList<>(List.of(
            new User("1", new HashMap<>(Map.of(TICKER, 10.0, "USD", 50000.0))),
            new User("2", new HashMap<>(Map.of(TICKER, 10.0, "USD", 50000.0)))
    ));

    private final List<Order> bids = new ArrayList<>();
    private final List<Order> asks = new ArrayList<>();

    @PostMapping("/order")
    public Map<String, Object> placeOrder(@RequestBody Map<String, Object> payload) {
        String side = (String) payload.get("side");
        int price = Integer.parseInt((String)payload.get("price"));
        int quantity = Integer.parseInt((String)payload.get("quantity"));
        String userId = (String) payload.get("userId");

        double remainingQty = fillOrders(side, price, quantity, userId);

        if (remainingQty > 0) {
            if ("bid".equalsIgnoreCase(side)) {
                bids.add(new Order(userId, price, remainingQty));
                bids.sort((a, b) -> Double.compare(b.price, a.price)); // Descending
            } else {
                asks.add(new Order(userId, price, remainingQty));
                asks.sort(Comparator.comparingDouble(a -> a.price)); // Ascending
            }
        }

        return Map.of("filledQuantity", quantity - remainingQty);
    }

    @GetMapping("/depth")
    public Map<String, Object> getMarketDepth() {
        Map<Double, Map<String, Object>> depth = new TreeMap<>();

        for (Order bid : bids) {
            depth.computeIfAbsent(bid.price, k -> new HashMap<>(Map.of("type", "bid", "quantity", 0.0)));
            depth.get(bid.price).put("quantity", (double) depth.get(bid.price).get("quantity") + bid.quantity);
        }

        for (Order ask : asks) {
            depth.computeIfAbsent(ask.price, k -> new HashMap<>(Map.of("type", "ask", "quantity", 0.0)));
            depth.get(ask.price).put("quantity", (double) depth.get(ask.price).get("quantity") + ask.quantity);
        }

        return Map.of("depth", depth);
    }

    @GetMapping("/balance/{userId}")
    public Map<String, Map<String, Double>> getUserBalance(@PathVariable String userId) {
        return users.stream()
                .filter(user -> user.id.equals(userId))
                .findFirst()
                .map(user -> Map.of("balances", user.balances))
                .orElse(Map.of("balances", Map.of(TICKER, 0.0, "USD", 0.0)));
    }

    private double fillOrders(String side, double price, double quantity, String userId) {
        List<Order> oppositeOrders = "bid".equalsIgnoreCase(side) ? asks : bids;
        Iterator<Order> iterator = oppositeOrders.iterator();

        while (iterator.hasNext() && quantity > 0) {
            Order order = iterator.next();

            if (("bid".equalsIgnoreCase(side) && order.price > price) ||
                    ("ask".equalsIgnoreCase(side) && order.price < price)) {
                continue;
            }

            if (order.quantity > quantity) {
                order.quantity -= quantity;
                order.quantity=Math.max(order.quantity, 0);
                flipBalance(order.userId, userId, quantity, order.price);
                return 0;
            } else {
                quantity -= order.quantity;
                quantity = Math.max(quantity, 0);
                flipBalance(order.userId, userId, order.quantity, order.price);
                iterator.remove();
            }
        }

        return quantity;
    }

    private void flipBalance(String userId1, String userId2, double quantity, double price) {
        User user1 = users.stream().filter(u -> u.id.equals(userId1)).findFirst().orElse(null);
        User user2 = users.stream().filter(u -> u.id.equals(userId2)).findFirst().orElse(null);

        if (user1 == null || user2 == null) {
            return;
        }

        user1.balances.put(TICKER, user1.balances.getOrDefault(TICKER, 0.0) - quantity);
        user2.balances.put(TICKER, user2.balances.getOrDefault(TICKER, 0.0) + quantity);

        user1.balances.put("USD", user1.balances.getOrDefault("USD", 0.0) + quantity * price);
        user2.balances.put("USD", user2.balances.getOrDefault("USD", 0.0) - quantity * price);
    }
}
