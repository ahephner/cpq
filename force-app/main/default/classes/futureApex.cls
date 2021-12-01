public with sharing class futureApex {
	//Product Search
	@AuraEnabled 
  public static PricebookEntry[] searchProduct(string searchKey, string cat, string family, string priceBookId){
      string searchterm = '%' + searchKey + '%'; 
      string category = cat; 
      string pf = family; 
      string pbId = priceBookId; 
      system.debug(pf);
      String query = 'Select Id,'
                + '  Product2.ProductCode, Product2.Name, Product2.Product_Status__c,UnitPrice, Product2.Product_Family__c, Product2.Subcategory__c, '
                + '  Product2.Floor_Type__c, Product2.Floor_Price__c, product2.agency__c, product2.Total_Product_Items__c'
                + ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND'; 
                 
      if(!searchterm.contains('null') && category == 'All' && pf == 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)';
      }else if (!searchterm.contains('null') && category != 'All' && pf == 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.subcategory__c =:category';
      }else if(!searchterm.contains('null') && category == 'All' && pf != 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.Product_Family__c =:pf';
      }else if (searchterm.contains('null') && category != 'All' && pf == 'All'){
          query += ' Product2.subcategory__c =:category';
      }else if(searchterm.contains('null') && category == 'All' && pf != 'All'){
          query += ' Product2.Product_Family__c =:pf';
      }else if(searchterm.contains('null') && category != 'All' && pf != 'All'){
          query += ' Product2.Product_Family__c =:pf and Product2.subcategory__c =:category'; 
      }else{
         
      }		 
       //system.debug(query);
      // set<id> prodIds = new Set<id>();
       list<PricebookEntry> results = Database.query(query);
	//	      for(pricebookentry x:results){
      //    			prodIds.add(x.Product2Id);
    //  }
      	//system.debug('prodIds '+prodIds);
     // cpqApex.inventoryCount(prodIds); 
      return results; 
  } 
    
    //this is where we try and get the inventory. For now we are gonna show the inventory across all locations
    //then will get at that location on select similar to last paid. 
    @AuraEnabled(cacheable = true)
        public static list<productitem> inventoryCount(list<id> ids){
            list<productitem> counts = [select id, quantityonhand,Product2Id from productitem
                                       where product2Id in : ids];
            system.debug('inven count '+counts);
            return counts; 
        }
}