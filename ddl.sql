CREATE TABLE Chains (
    ID int NOT NULL AUTO_INCREMENT,
    name varchar(45) NOT NULL,
    PRIMARY KEY (ID)
);

CREATE TABLE Stores (
    ID int NOT NULL AUTO_INCREMENT,
    chainID int NOT NULL,
    houseNumber int DEFAULT NULL,
    street varchar(45) DEFAULT NULL,
    city varchar(45) DEFAULT NULL,
    state varchar(45) DEFAULT NULL,
    postCode varchar(45) DEFAULT NULL,
    country varchar(45) DEFAULT NULL,
    PRIMARY KEY (ID),
    CONSTRAINT Stores_chainID_FK FOREIGN KEY (chainID) REFERENCES Chains (ID)
);

CREATE TABLE Shoppers (
    ID char(36) NOT NULL,
    PRIMARY KEY (ID)
);

CREATE TABLE Items (
    ID int NOT NULL AUTO_INCREMENT,
    name varchar(45) NOT NULL,
    category varchar(45) NOT NULL,
    mostRecentPrice decimal(10,2) DEFAULT NULL,
    PRIMARY KEY (ID)
);

CREATE TABLE Receipts (
    ID int NOT NULL AUTO_INCREMENT,
    date datetime DEFAULT NULL,
    storeID int NOT NULL,
    shopperID char(36) NOT NULL,
    PRIMARY KEY (ID), 
    CONSTRAINT Receipts_shopperID_FK FOREIGN KEY (shopperID) REFERENCES Shoppers (ID),
    CONSTRAINT Receipts_storeID_FK FOREIGN KEY (storeID) REFERENCES Stores (ID)
);

CREATE TABLE Purchases (
    ID int NOT NULL AUTO_INCREMENT,
    price decimal(10,2) DEFAULT NULL,
    date datetime DEFAULT NULL,
    receiptID int NOT NULL,
    itemID int NOT NULL,
    PRIMARY KEY (ID),
    CONSTRAINT Purchases_receiptID_FK FOREIGN KEY (receiptID) REFERENCES Receipts (ID),
    CONSTRAINT Purchases_itemID_FK FOREIGN KEY (itemID) REFERENCES Items (ID)
);

CREATE TABLE ShoppingLists (
    ID int NOT NULL AUTO_INCREMENT,
    name varchar(45) DEFAULT NULL,
    type varchar(45) DEFAULT NULL,
    shopperID char(36) NOT NULL,
    PRIMARY KEY (ID),
    CONSTRAINT ShoppingLists_shopperID_FK FOREIGN KEY (shopperID) REFERENCES Shoppers (ID)
);

CREATE TABLE ShoppingListItems (
    shoppingListID int NOT NULL,
    itemID int NOT NULL,
    PRIMARY KEY (shoppingListID,itemID),
    CONSTRAINT ShoppingListItem_itemID_FK FOREIGN KEY (itemID) REFERENCES Items (ID),
    CONSTRAINT ShoppingListItem_listID_FK FOREIGN KEY (shoppingListID) REFERENCES ShoppingLists (ID)
);

