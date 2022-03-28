public with sharing class quickPriceSearch {
    @AuraEnabled(cacheable = true)
    public static list<PricebookEntry> getPricing(string priceBookId, string searchKey){
        string searchterm = '%' + searchKey + '%'; 
        string pbId = priceBookId;
        string pClass = 'Simple';
       system.debug(searchterm);
       system.debug(pbId);
        string query = 'Select Id,'
                    + 'Product2.Name, Product2.Product_Status__c,Product2.ProductCode, Agency_Product__c,product2.Total_Product_Items__c,'
                    + ' Product2.Floor_Price__c,Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c'
                    + ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND Product2.ProductClass =:pClass AND'
                    + ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)';
       
       //system.debug(query);
       list<PricebookEntry> results = Database.query(query);
       //system.debug(results);
       return results; 
    }
}