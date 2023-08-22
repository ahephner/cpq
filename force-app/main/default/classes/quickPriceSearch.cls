public class quickPriceSearch {
    @AuraEnabled(cacheable = true)
    public static list<PricebookEntry> getPricing(string priceBookId, string searchKey){
         string searchterm = '%' + searchKey + '%'; 
         string pbId = priceBookId;
         string pClass = 'Simple';
        //system.debug(searchterm);
        //system.debug(pbId);
         string query = 'Select Id,'
             		+ 'Product2.Name, Floor_Price__c, Product2.Product_Status__c,Product2.ProductCode, Agency_Product__c,product2.Total_Product_Items__c,'
             		+ ' Product2.Floor_Price__c,Floor_Margin__c, Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c'
             		+ ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND Product2.ProductClass =:pClass AND'
             		+ ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)'
        			+ ' order by Product_Status__c  desc nulls last';
        //system.debug(query);
        list<PricebookEntry> results = Database.query(query);
        //system.debug(results);
        return results; 
      
    }
    @AuraEnabled(cacheable = true)
    public static list<tag__c> searchTag(string searchKey){
         string searchterm = '%' + searchKey + '%'; 
         
        list<tag__c> tags = Database.query('select Id, Product_Name__c, ATS_Score__c, Tag_description__c ' 
                                           +' from tag__c where Search_Slug_2__c like :searchterm order by ATS_Score__c desc nulls last'); 
        return tags; 
    }
    
        @AuraEnabled(cacheable = true)
    public static list<Tag__c> searchTagSOSL(string searchKey){
         //string searchTerm = searchKey +' order by ATS_Score__c desc nulls last)'; 
        list<Tag__c> tagList = new list<Tag__c>();
        
        //String searchquery='FIND \''+searchKey+'\'IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,'
            				//+' Product__c, Product_Name__c, ATS_Score__c where product__r.IsActive = true)'; 
        
		List<List<SObject>>searchList=search.query(searchKey);
		       //List<List<sObject>> searchList = [FIND 'ants or stock' IN ALL FIELDS RETURNING Tag__c(id, Tag_Description__c, Search_Slug_2__c,Product__c, Product_Name__c, ATS_Score__c where product__r.IsActive = true)];
        tagList = searchList[0]; 
        return tagList;
    }
    @AuraEnabled(cacheable = true)
    public static list<Tag__c> cpqSearchTag(string searchKey){
        list<Tag__c> tagList = new List<Tag__c>();
        
        List<List<SObject>>searchList=search.query(searchKey);
        
        tagList = searchList[0]; 
        return tagList;
    }
    
    @auraEnabled(cacheable = true)
    public static list<Search_Label__c> searchPromos(){
        date today = date.today();
        list<Search_Label__c> currentPromos = [select id,Name, Expiration_Date__c from Search_Label__c
                             				  where Expiration_Date__c >= :today and Label_Category__c= 'Promotional' order by Expiration_Date__c DESC]; 
        return currentPromos; 
    }
    //Search with just the filters buttons
    @AuraEnabled(cacheable=true)
    public static list <tag__c> cpqFilterSearch(string cat, string family){
        
        
        return null; 
    }
    
    //get selected products
    @AuraEnabled
    public static PricebookEntry selectedProducts(string productIds, string priceBookId){
      string pbId = priceBookId;  
      string pClass = 'Simple';
      
      String query = 'Select Id,'
                + '  Product2.ProductCode, Product2.Name, Product2.Product_Status__c, Product2.Product_Family__c, Product2.Subcategory__c, Product2.Ship_Weight__c, Product2.Pallet_Qty__c,'
                + '  Product2.Floor_Type__c, Product2.Floor_Price__c, Product2.Last_Purchase_Price__c, Agency_Product__c, product2.Total_Product_Items__c, Product2.Temp_Unavailable__c,'
          		+ ' Floor_Price__c, Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c, Product2.Temp_Mess__c, Product2.SGN__C'
                + ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND Product2.ProductClass =:pClass AND Product2Id =:productIds' ; 
               
      PricebookEntry results = Database.query(query);
	    	
      return results; 
    }
}

//Name, ProductCode, title, Product2.Floor_Type__c, onhand, status,