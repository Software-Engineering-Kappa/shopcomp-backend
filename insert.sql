INSERT INTO Chains VALUES (1, "Market Basket");
INSERT INTO Chains VALUES (2, "BJs");
INSERT INTO Chains VALUES (3, "Price Chopper");

INSERT INTO Stores VALUES (1, 1, 200, "Hartford", "Shrewsbury Tpke", "MA", "01545", "USA");
INSERT INTO Stores VALUES (2, 2, 1, "Highland Commons W", "Hudson", "MA", "01749", "USA");
INSERT INTO Stores VALUES (3, 3, 221, "Park Ave", "Worcester", "MA", "01609", "USA");

INSERT INTO Receipts VALUES (1, "2025-08-16 10:30:00", 1, "XXX");

CREATE TABLE Receipts (
    ID int NOT NULL AUTO_INCREMENT,
    date datetime DEFAULT NULL,
    storeID int NOT NULL,
    shopperID char(36) NOT NULL,
    PRIMARY KEY (ID), 
    CONSTRAINT Receipts_shopperID_FK FOREIGN KEY (shopperID) REFERENCES Shoppers (ID),
    CONSTRAINT Receipts_storeID_FK FOREIGN KEY (storeID) REFERENCES Stores (ID)
);