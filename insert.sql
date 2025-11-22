INSERT INTO Chains VALUES (1, "Market Basket");
INSERT INTO Chains VALUES (2, "BJs");
INSERT INTO Chains VALUES (3, "Price Chopper");

INSERT INTO Stores VALUES (1, 1, 200, "Hartford", "Shrewsbury Tpke", "MA", "01545", "USA");
INSERT INTO Stores VALUES (2, 2, 1, "Highland Commons W", "Hudson", "MA", "01749", "USA");
INSERT INTO Stores VALUES (3, 3, 221, "Park Ave", "Worcester", "MA", "01609", "USA");

INSERT INTO Receipts VALUES (1, "2025-08-16 10:30:00", 1, "XXX"); -- Invalid shopperID for testing
INSERT INTO Receipts VALUES (2, "2025-11-16 18:07:00", 2, "XXX"); -- Invalid shopperID for testing
INSERT INTO Receipts VALUES (3, "2025-10-26 11:17:00", 3, "XXX"); -- Invalid shopperID for testing

-- Receipt #1
INSERT INTO Items VALUES (1, "Clorox Bleach Foamer", "Disinfectant", 4.79);
INSERT INTO Purchases VALUES (1, 4.79, "2025-08-16 10:30:00", 1, 1);
INSERT INTO Items VALUES (2, "Dawn", "Disinfectant", 2.99);
INSERT INTO Purchases VALUES (2, 2.99, "2025-08-16 10:30:00", 1, 2);
INSERT INTO Items VALUES (3, "MB Wipes Citrus", "Disinfectant", 2.99);
INSERT INTO Purchases VALUES (3, 2.99, "2025-08-16 10:30:00", 1, 3);

-- Receipt #2
INSERT INTO Items VALUES (1, "Bananas", "Produce", 0.59);
INSERT INTO Purchases VALUES (1, 1.18, "2025-11-16 18:07:00", 2, 1);
INSERT INTO Items VALUES (2, "Strawberries", "Produce", 3.49);
INSERT INTO Purchases VALUES (2, 3.49, "2025-11-16 18:07:00", 2, 2);

-- Receipt #3
INSERT INTO Items VALUES (1, "Whole Chicken", "Meat", 11.77);
INSERT INTO Purchases VALUES (1, 11.77, "2025-10-26 11:17:00", 3, 1);
INSERT INTO Items VALUES (2, "Ground Beef", "Meat", 8.99);
INSERT INTO Purchases VALUES (2, 8.99, "2025-10-26 11:17:00", 3, 2);


