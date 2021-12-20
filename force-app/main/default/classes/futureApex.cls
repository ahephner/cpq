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

    @AuraEnabled(cacheable=true)
    public static list<Sales_Doc_Detail__c> onLoadGetLastPaid(id accountId, list<string> productCodes){
        list<Sales_Doc_Detail__c> lastPaidList = new list<Sales_Doc_Detail__c>(); 
        map<string, date> sales = new map<string, date>();
        try {
            for(Sales_Doc_Detail__c record: [select id,name,Unit_Price__c,Margin__c, Doc_Date__c from sales_doc_detail__c
            where Product_Code__c In: (productCodes) and Sales_Document__r.customer__c =: accountId
            order by Sales_Document__r.doc_date__c desc]){
                if((lastPaidList = sales.get(record.Product_Code__c)) == null){
                    sales.put(record.Product_Code__c, record.Doc_Date__c);
                }
                lastPaidList.add(record)
            }
            system.debug('lp '+lastPaidList); 
            return lastPaidList; 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


Contact[] temp;
Map<Id, Contact[]> mapcontacts = new map<Id, Contact[]>();
for(Contact record: [SELECT AccountId FROM Contact]) {
    if((temp = mapcontacts.get(record.AccountId)) == null) {
        mapcontacts.put(record.AccountId, temp = new Contact[0]);
    }
    temp.add(record);
}

//does not work because it assumes there is always going to be a searchKey
@AuraEnabled 
public static sObject[] searchProductWarehouse(string searchKey, string cat, string family, string priceBookId, string location){
    string searchterm = '%' + searchKey + '%'; 
    string category = cat; 
    string pf = family; 
    string pbId = priceBookId;
    string locId = location; 
    system.debug(pf);
    system.debug(searchterm);
    String query = 'Select Id,'
              + '  ProductCode, Name, Product_Status__c,Product_Family__c, Subcategory__c, '
              + '  Floor_Type__c, Floor_Price__c, agency__c, Total_Product_Items__c,'
                + ' (select id, QuantityOnHand from ProductItems where product2.name like :searchTerm and LocationId =:locId),'
                + ' (select id, UnitPrice from PriceBookEntries where product2.name like :searchTerm  and IsActive = True and Pricebook2Id =: pbId)'
              + ' From product2 ';  
               
    if(!searchterm.contains('null') && category == 'All' && pf == 'All'){
        query += ' where (ProductCode like :searchTerm or Name like :searchTerm)';
    }else if (!searchterm.contains('null') && category != 'All' && pf == 'All'){
        query += ' where (ProductCode like :searchTerm or Name like :searchTerm) and subcategory__c =:category';
    }else if(!searchterm.contains('null') && category == 'All' && pf != 'All'){
        query += ' where (ProductCode like :searchTerm or Name like :searchTerm) and Product_Family__c =:pf';
    }else if (searchterm.contains('null') && category != 'All' && pf == 'All'){
        query += ' where subcategory__c =:category';
    }else if(searchterm.contains('null') && category == 'All' && pf != 'All'){
        query += ' where Product_Family__c =:pf';
    }else if(searchterm.contains('null') && category != 'All' && pf != 'All'){
        query += ' where Product_Family__c =:pf and subcategory__c =:category'; 
    }else{
       
    }		 
     
     list<sObject> results = Database.query(query);
     //futureApex.invCountByWarehouse('132', results); 	
    return results; 
}



}

