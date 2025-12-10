SET SQL_SAFE_UPDATES = 0;
DELETE FROM Purchases;
DELETE FROM Items;
DELETE FROM Receipts;
DELETE FROM Stores;
DELETE FROM Chains;
DELETE FROM Shoppers;
SET SQL_SAFE_UPDATES = 1;



INSERT INTO Chains VALUES (1, "Market Basket");
INSERT INTO Chains VALUES (2, "BJs");
INSERT INTO Chains VALUES (3, "Price Chopper");

INSERT INTO Stores VALUES (1, 1, 200, "Hartford", "Shrewsbury Tpke", "MA", "01545", "USA");
INSERT INTO Stores VALUES (2, 2, 1, "Highland Commons W", "Hudson", "MA", "01749", "USA");
INSERT INTO Stores VALUES (3, 3, 221, "Park Ave", "Worcester", "MA", "01609", "USA");

INSERT INTO Shoppers VALUES ('b4683498-00e1-70f2-103e-594174666691'); -- Test User #1
INSERT INTO Shoppers VALUES ('c4f85428-a0f1-70aa-bd7b-f6169dfde1c5'); -- Test User #2

INSERT INTO Receipts VALUES (1, "2025-08-16 10:30:00", 1, 'c4f85428-a0f1-70aa-bd7b-f6169dfde1c5');
INSERT INTO Receipts VALUES (2, "2025-11-16 18:07:00", 2, 'c4f85428-a0f1-70aa-bd7b-f6169dfde1c5');
INSERT INTO Receipts VALUES (3, "2025-10-26 11:17:00", 3, 'c4f85428-a0f1-70aa-bd7b-f6169dfde1c5');

-- Receipt #1
INSERT INTO Items VALUES (1, "Clorox Bleach Foamer", "Disinfectant", 4.79);
INSERT INTO Purchases VALUES (1, 4.79, "2025-08-16 10:30:00", 1, 1);
INSERT INTO Items VALUES (2, "Dawn", "Disinfectant", 2.99);
INSERT INTO Purchases VALUES (2, 2.99, "2025-08-16 10:30:00", 1, 2);
INSERT INTO Items VALUES (3, "MB Wipes Citrus", "Disinfectant", 2.99);
INSERT INTO Purchases VALUES (3, 2.99, "2025-08-16 10:30:00", 1, 3);

-- Receipt #2
INSERT INTO Items VALUES (4, "Bananas", "Produce", 0.59);
INSERT INTO Purchases VALUES (4, 1.18, "2025-11-16 18:07:00", 2, 4);
INSERT INTO Items VALUES (5, "Strawberries", "Produce", 3.49);
INSERT INTO Purchases VALUES (5, 3.49, "2025-11-16 18:07:00", 2, 5);

-- Receipt #3
INSERT INTO Items VALUES (6, "Whole Chicken", "Meat", 11.77);
INSERT INTO Purchases VALUES (6, 11.77, "2025-10-26 11:17:00", 3, 6);
INSERT INTO Items VALUES (7, "Ground Beef", "Meat", 8.99);
INSERT INTO Purchases VALUES (7, 8.99, "2025-10-26 11:17:00", 3, 7);


-- Shoppinglist #1
INSERT INTO 

    { shoppingListID: 1, name: "Milk", category: "Dairy", quantity: 2, itemID: 1 },
    { shoppingListID: 1, name: "Eggs", category: "Dairy", quantity: 12, itemID: 2 },
    { shoppingListID: 1, name: "Bread", category: "Bakery", quantity: 1, itemID: 3 },
    { shoppingListID: 1, name: "Apples", category: "Fruits", quantity: 6, itemID: 4 },
