import React, { useState, useEffect } from "react";
import { Card, CardContent } from '@mui/material'
import { Button } from '@mui/material';
import axios from "axios";

const App = () => {
    const [orders, setOrders] = useState({ bids: [], asks: [] });
    const [balancesUser1, setBalancesUser1] = useState({});
    const [balancesUser2, setBalancesUser2] = useState({});
    const [newOrder, setNewOrder] = useState({ side: "bid", price: "", quantity: "", userId: "" });

    const fetchDepth = async () => {
        try {
            const res = await axios.get("http://localhost:8080/api/depth");
            setOrders(res.data.depth);
        } catch (err) {
            console.error("Error fetching market depth:", err);
        }
    };

    const fetchBalances = async () => {
        try {
            const res1 = await axios.get("http://localhost:8080/api/balance/1"); // Fetch balances for user 1 as an example
            setBalancesUser1(res1.data.balances);
            const res2 = await axios.get("http://localhost:8080/api/balance/2"); // Fetch balances for user 1 as an example
            setBalancesUser2(res2.data.balances);
        } catch (err) {
            console.error("Error fetching balances:", err);
        }
    };

    useEffect(() => {
        fetchDepth();
        fetchBalances();
    }, [setBalancesUser1,setBalancesUser2]);

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:8080/api/order", newOrder, {
                headers: { "Content-Type": "application/json" },
            });
            fetchDepth();
            fetchBalances();
            console.log("Order submitted:", res.data);
        } catch (err) {
            console.error("Error submitting order:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-4xl font-bold mb-6 text-center">Trading Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Depth */}
                <Card className="bg-gray-800">
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">Market Depth</h2>
                        <div>
                            <h3 className="text-lg font-medium">Bids</h3>
                            <ul className="space-y-2">
                                {Object.entries(orders)
                                    .filter(([_, order]) => order.type === "bid")
                                    .map(([price, order]) => (
                                        <li key={price}>{`Price: ${price}, Quantity: ${order.quantity}`}</li>
                                    ))}
                            </ul>
                            <h3 className="text-lg font-medium mt-6">Asks</h3>
                            <ul className="space-y-2">
                                {Object.entries(orders)
                                    .filter(([_, order]) => order.type === "ask")
                                    .map(([price, order]) => (
                                        <li key={price}>{`Price: ${price}, Quantity: ${order.quantity}`}</li>
                                    ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Balances */}
                <Card className="bg-gray-800">
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">User 1 Balance</h2>
                        <ul className="space-y-2">
                            {Object.entries(balancesUser1).map(([key, value]) => (
                                <li key={key}>{`${key}: ${value}`}</li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">User 2 Balance</h2>
                        <ul className="space-y-2">
                            {Object.entries(balancesUser2).map(([key, value]) => (
                                <li key={key}>{`${key}: ${value}`}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Place Order */}
                <Card className="bg-gray-800 md:col-span-2">
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">Place New Order</h2>
                        <form onSubmit={handleOrderSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select
                                    value={newOrder.side}
                                    onChange={(e) => setNewOrder({ ...newOrder, side: e.target.value })}
                                    className="border border-gray-700 rounded p-2 bg-gray-700 text-white focus:outline-none"
                                >
                                    <option value="bid">Bid</option>
                                    <option value="ask">Ask</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={newOrder.price}
                                    onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                                    className="border border-gray-700 rounded p-2 bg-gray-700 text-white focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={newOrder.quantity}
                                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                                    className="border border-gray-700 rounded p-2 bg-gray-700 text-white focus:outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="User ID"
                                    value={newOrder.userId}
                                    onChange={(e) => setNewOrder({ ...newOrder, userId: e.target.value })}
                                    className="border border-gray-700 rounded p-2 bg-gray-700 text-white focus:outline-none"
                                />
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" type="submit">
                                Submit Order
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default App;
