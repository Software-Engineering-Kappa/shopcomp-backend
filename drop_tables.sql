-- Drop foreign key constraints
ALTER TABLE Stores DROP FOREIGN KEY Stores_chainID_FK;
ALTER TABLE Receipts DROP FOREIGN KEY Receipts_shopperID_FK;
ALTER TABLE Receipts DROP FOREIGN KEY Receipts_storeID_FK;
ALTER TABLE Purchases DROP FOREIGN KEY Purchases_receiptID_FK;
ALTER TABLE Purchases DROP FOREIGN KEY Purchases_itemID_FK;
ALTER TABLE ShoppingLists DROP FOREIGN KEY ShoppingLists_shopperID_FK;
ALTER TABLE ShoppingListItems DROP FOREIGN KEY ShoppingListItem_itemID_FK;
ALTER TABLE ShoppingListItems DROP FOREIGN KEY ShoppingListItem_listID_FK;

-- Drop tables
DROP TABLE IF EXISTS ShoppingListItems;
DROP TABLE IF EXISTS ShoppingLists;
DROP TABLE IF EXISTS Purchases;
DROP TABLE IF EXISTS Receipts;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Stores;
DROP TABLE IF EXISTS Chains;
DROP TABLE IF EXISTS Shoppers;
